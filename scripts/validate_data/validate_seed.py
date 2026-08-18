from __future__ import annotations

import json
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[2]
SEED = ROOT / "data" / "seed" / "demo_seed.json"
ALLOWED_RIGHTS = {"LOCALLY_CREATED_DEMO", "CC0", "EXPLICITLY_PERMITTED"}
PUBLIC_ASSET_ROOT = (ROOT / "frontend" / "public").resolve()


def local_asset(path: str) -> Path | None:
    if not path.startswith("/assets/") or not path.endswith(".svg"):
        return None
    candidate = (PUBLIC_ASSET_ROOT / path.lstrip("/")).resolve()
    try:
        candidate.relative_to(PUBLIC_ASSET_ROOT)
    except ValueError:
        return None
    return candidate


def validate() -> None:
    payload = json.loads(SEED.read_text(encoding="utf-8"))
    products = payload["products"]
    coordinates = payload["coordinates"]
    errors: list[str] = []
    product_ids = {product["id"] for product in products}

    if not 50 <= len(products) <= 100:
        errors.append(f"product count {len(products)} is outside 50-100")
    if not 30 <= len(coordinates) <= 50:
        errors.append(f"coordinate count {len(coordinates)} is outside 30-50")
    if len(product_ids) != len(products):
        errors.append("duplicate product IDs")

    for product in products:
        if product["rights_status"] not in ALLOWED_RIGHTS:
            errors.append(f"unsafe product rights: {product['id']}")
        if not product["id"].startswith("DEMO-"):
            errors.append(f"non-demo product ID: {product['id']}")
        official_url = urlsplit(product["official_url"])
        if (
            official_url.scheme != "https"
            or official_url.hostname != "www.nitori-net.jp"
            or not official_url.path.startswith("/ec/search/")
            or official_url.username
            or official_url.password
        ):
            errors.append(f"unexpected official URL: {product['id']}")
        asset = local_asset(product["image_url"])
        if asset is None:
            errors.append(f"external product image is not allowed: {product['id']}")
        elif not asset.is_file():
            errors.append(f"missing product asset: {product['id']}")
        if (product["price_snapshot"] is None) != (product["price_status"] == "MISSING"):
            errors.append(f"inconsistent missing price state: {product['id']}")

    for coordinate in coordinates:
        required = {
            "title",
            "description",
            "kind",
            "room_type",
            "size_band",
            "housing_type",
            "household",
            "budget_band",
            "style",
            "needs",
            "items",
            "provenance",
            "verification_state",
            "image_rights",
            "demo_disclosure",
        }
        missing = required - coordinate.keys()
        if missing:
            errors.append(f"{coordinate['id']} missing {sorted(missing)}")
        if coordinate["image_rights"] not in ALLOWED_RIGHTS:
            errors.append(f"unsafe coordinate image rights: {coordinate['id']}")
        if not coordinate["demo_disclosure"]:
            errors.append(f"missing demo disclosure: {coordinate['id']}")
        asset = local_asset(coordinate["image_url"])
        if asset is None:
            errors.append(f"external coordinate image is not allowed: {coordinate['id']}")
        elif not asset.is_file():
            errors.append(f"missing coordinate asset: {coordinate['id']}")
        categories = set()
        for item in coordinate["items"]:
            if item["product_id"] not in product_ids:
                errors.append(f"unknown product {item['product_id']} in {coordinate['id']}")
            categories.add(item["role"])
        if len(categories) < 2:
            errors.append(f"{coordinate['id']} has fewer than two roles")

    if len({row["size_band"] for row in coordinates}) < 3:
        errors.append("seed does not cover all three room-size bands")
    if len({need for row in coordinates for need in row["needs"] if need != "RENTAL"}) < 6:
        errors.append("seed does not cover six discovery needs")
    if not any(row.get("existing_furniture") for row in coordinates):
        errors.append("seed has no existing-furniture example")
    if not any(product["price_snapshot"] is None for product in products):
        errors.append("seed has no explicit missing-price example")

    golden = next(item for item in coordinates if item["id"] == "coord-001")
    if not {"STORAGE", "RENTAL"}.issubset(golden["needs"]) or golden["size_band"] != "SMALL_6":
        errors.append("coord-001 no longer satisfies the golden context")
    if golden["budget_max"] > 50_000:
        errors.append("coord-001 no longer fits the golden budget")

    if errors:
        raise SystemExit("Seed validation failed:\n- " + "\n- ".join(errors))
    print(f"Seed validation passed: {len(coordinates)} coordinates, {len(products)} products")


if __name__ == "__main__":
    validate()
