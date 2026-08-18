from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from urllib.parse import urlsplit


ROOT = Path(__file__).resolve().parents[2]
SEED = ROOT / "data" / "seed" / "demo_seed.json"
SEASONAL_SEED = ROOT / "data" / "seed" / "seasonal_seed.json"
VISUAL_MANIFEST = ROOT / "data" / "seed" / "visual_asset_manifest.json"
ALLOWED_RIGHTS = {"LOCALLY_CREATED_DEMO", "CC0", "EXPLICITLY_PERMITTED"}
PUBLIC_ASSET_ROOT = (ROOT / "frontend" / "public").resolve()
CHALLENGE_STATUSES = {"UPCOMING", "ACTIVE", "ENDED", "ARCHIVED"}
CHALLENGE_TYPES = {"LIFE_EVENT", "CONSTRAINT", "ADAPT_REMIX"}
SEASONS = {"SPRING", "SUMMER", "AUTUMN", "WINTER"}
ENTRY_STATUSES = {"ACTIVE", "WITHDRAWN", "HIDDEN"}
RECOGNITIONS = {
    "OFFICIAL_PICK",
    "USEFUL_REUSE",
    "SMART_BUDGET",
    "SMALL_SPACE_IDEA",
    "EXISTING_FURNITURE",
    "REAL_ROOM_STORY",
}
CONSTRAINT_CODES = {
    "SIZE_BAND",
    "HOUSEHOLD",
    "HOUSING_TYPE",
    "BUDGET_MAX",
    "KIND",
    "IMAGE_REQUIRED",
    "MIN_PRODUCT_COUNT",
}
CONSTRAINT_OPERATORS = {"IN", "LTE", "GTE", "EQ"}
FAKE_COUNT_FIELDS = {"entry_count", "participant_count", "view_count", "like_count", "rank"}


def local_asset(path: str) -> Path | None:
    if not path.startswith("/assets/") or Path(path).suffix.lower() not in {".svg", ".png", ".jpg", ".jpeg", ".webp"}:
        return None
    candidate = (PUBLIC_ASSET_ROOT / path.lstrip("/")).resolve()
    try:
        candidate.relative_to(PUBLIC_ASSET_ROOT)
    except ValueError:
        return None
    return candidate


def validate() -> None:
    payload = json.loads(SEED.read_text(encoding="utf-8"))
    seasonal_payload = json.loads(SEASONAL_SEED.read_text(encoding="utf-8"))
    visual_manifest = json.loads(VISUAL_MANIFEST.read_text(encoding="utf-8"))
    products = payload["products"]
    coordinates = payload["coordinates"]
    challenges = seasonal_payload["challenges"]
    entries = seasonal_payload["entries"]
    errors: list[str] = []
    product_ids = {product["id"] for product in products}
    coordinate_by_id = {coordinate["id"]: coordinate for coordinate in coordinates}

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
        size_label = {"TINY_5_5": "5.5畳", "SMALL_6": "6畳", "MEDIUM_7_8": "7〜8畳"}.get(
            coordinate["size_band"]
        )
        if not size_label or size_label not in coordinate["title"]:
            errors.append(f"coordinate title does not match room size: {coordinate['id']}")

    if len({row["size_band"] for row in coordinates}) < 3:
        errors.append("seed does not cover all three room-size bands")
    if len({need for row in coordinates for need in row["needs"] if need != "RENTAL"}) < 6:
        errors.append("seed does not cover six discovery needs")
    if not any(row.get("existing_furniture") for row in coordinates):
        errors.append("seed has no existing-furniture example")
    if not any(product["price_snapshot"] is None for product in products):
        errors.append("seed has no explicit missing-price example")

    visual_rows = visual_manifest.get("coordinates", [])
    if not 10 <= len(visual_rows) <= 15:
        errors.append(f"visual manifest needs 10-15 main coordinates, found {len(visual_rows)}")
    visual_ids = [row.get("coordinate_id") for row in visual_rows]
    current_assets = [row.get("current_asset") for row in visual_rows]
    if len(set(visual_ids)) != len(visual_ids):
        errors.append("duplicate coordinate ID in visual manifest")
    if len(set(current_assets)) != len(current_assets):
        errors.append("main demo coordinates must have distinct current visual assets")
    fallback = local_asset(str(visual_manifest.get("fallback_asset", "")))
    if fallback is None or not fallback.is_file():
        errors.append("visual manifest fallback asset is missing or external")
    for row in visual_rows:
        coordinate_id = str(row.get("coordinate_id", ""))
        coordinate = coordinate_by_id.get(coordinate_id)
        if coordinate is None:
            errors.append(f"unknown coordinate in visual manifest: {coordinate_id}")
            continue
        if row.get("rights_status") not in ALLOWED_RIGHTS:
            errors.append(f"unsafe visual manifest rights: {coordinate_id}")
        current_asset = local_asset(str(row.get("current_asset", "")))
        if current_asset is None or not current_asset.is_file():
            errors.append(f"missing current visual asset: {coordinate_id}")
        if coordinate.get("image_url") != row.get("current_asset"):
            errors.append(f"seed/manifest image mismatch: {coordinate_id}")
        expected_room = {
            "TINY_5_5": "5.5畳ワンルーム",
            "SMALL_6": "6畳ワンルーム",
            "MEDIUM_7_8": "7〜8畳ワンルーム",
        }.get(coordinate.get("size_band"))
        if row.get("room") != expected_room:
            errors.append(f"seed/manifest room mismatch: {coordinate_id}")
        if row.get("style") != coordinate.get("style"):
            errors.append(f"seed/manifest style mismatch: {coordinate_id}")
        if row.get("need") not in coordinate.get("needs", []):
            errors.append(f"seed/manifest need mismatch: {coordinate_id}")
        actual_roles = {item.get("role") for item in coordinate.get("items", [])}
        if not set(row.get("product_roles", [])).issubset(actual_roles):
            errors.append(f"seed/manifest product role mismatch: {coordinate_id}")
        future_asset = local_asset(str(row.get("future_asset", "")))
        if future_asset is None:
            errors.append(f"future visual path must stay local and use an approved format: {coordinate_id}")
        if not str(row.get("future_direction", "")).strip():
            errors.append(f"missing future visual direction: {coordinate_id}")

    golden = next(item for item in coordinates if item["id"] == "coord-001")
    if not {"STORAGE", "RENTAL"}.issubset(golden["needs"]) or golden["size_band"] != "SMALL_6":
        errors.append("coord-001 no longer satisfies the golden context")
    if golden["budget_max"] > 50_000:
        errors.append("coord-001 no longer fits the golden budget")

    challenge_ids = {challenge["id"] for challenge in challenges}
    challenge_slugs = {challenge["slug"] for challenge in challenges}
    if len(challenge_ids) != len(challenges):
        errors.append("duplicate challenge IDs")
    if len(challenge_slugs) != len(challenges):
        errors.append("duplicate challenge slugs")
    if len(challenges) < 6:
        errors.append("seasonal seed needs at least six challenge states/themes")
    if {challenge["status"] for challenge in challenges} != CHALLENGE_STATUSES:
        errors.append("seasonal seed does not cover all four challenge statuses")

    challenge_by_id = {challenge["id"]: challenge for challenge in challenges}
    for challenge in challenges:
        challenge_id = challenge["id"]
        if challenge["status"] not in CHALLENGE_STATUSES:
            errors.append(f"invalid challenge status: {challenge_id}")
        if challenge["challenge_type"] not in CHALLENGE_TYPES:
            errors.append(f"invalid challenge type: {challenge_id}")
        if challenge["season"] not in SEASONS:
            errors.append(f"invalid challenge season: {challenge_id}")
        if challenge["provenance"] != "DEMO":
            errors.append(f"non-demo challenge provenance: {challenge_id}")
        start_at = datetime.fromisoformat(challenge["start_at"])
        end_at = datetime.fromisoformat(challenge["end_at"])
        archive_at = datetime.fromisoformat(challenge["archive_at"])
        if not start_at < end_at < archive_at:
            errors.append(f"invalid challenge date order: {challenge_id}")
        if start_at.year != challenge["year"]:
            errors.append(f"challenge year does not match start date: {challenge_id}")
        if FAKE_COUNT_FIELDS.intersection(challenge):
            errors.append(f"stored/fake count field on challenge: {challenge_id}")
        asset = local_asset(challenge["cover_asset"])
        if asset is None:
            errors.append(f"external challenge image is not allowed: {challenge_id}")
        elif not asset.is_file():
            errors.append(f"missing challenge asset: {challenge_id}")

        eligibility = challenge.get("eligibility")
        constraints = challenge.get("constraints")
        if not isinstance(eligibility, dict):
            errors.append(f"challenge eligibility is not structured: {challenge_id}")
            continue
        if not isinstance(constraints, list) or not constraints:
            errors.append(f"challenge constraints are not structured: {challenge_id}")
            continue
        for constraint in constraints:
            if constraint.get("code") not in CONSTRAINT_CODES:
                errors.append(f"invalid constraint code on {challenge_id}: {constraint.get('code')}")
            if constraint.get("operator") not in CONSTRAINT_OPERATORS:
                errors.append(f"invalid constraint operator on {challenge_id}: {constraint.get('operator')}")
            if not isinstance(constraint.get("values"), list) or not constraint["values"]:
                errors.append(f"empty constraint values on {challenge_id}: {constraint.get('code')}")
            if not str(constraint.get("label", "")).strip():
                errors.append(f"missing constraint label on {challenge_id}: {constraint.get('code')}")

    entry_pairs: set[tuple[str, str]] = set()
    entry_ids: set[str] = set()
    for entry in entries:
        entry_id = entry["id"]
        challenge_id = entry["challenge_id"]
        coordinate_id = entry["coordinate_id"]
        if entry_id in entry_ids:
            errors.append(f"duplicate challenge entry ID: {entry_id}")
        entry_ids.add(entry_id)
        pair = (challenge_id, coordinate_id)
        if pair in entry_pairs:
            errors.append(f"duplicate challenge/coordinate entry: {challenge_id}/{coordinate_id}")
        entry_pairs.add(pair)
        if challenge_id not in challenge_ids:
            errors.append(f"unknown challenge in entry: {entry_id}")
            continue
        coordinate = coordinate_by_id.get(coordinate_id)
        if coordinate is None:
            errors.append(f"unknown coordinate in entry: {entry_id}")
            continue
        if entry["status"] not in ENTRY_STATUSES:
            errors.append(f"invalid challenge entry status: {entry_id}")
        recognition = entry.get("recognition")
        if recognition is not None and recognition not in RECOGNITIONS:
            errors.append(f"invalid challenge recognition: {entry_id}")
        if entry["provenance"] != "DEMO":
            errors.append(f"non-demo challenge entry provenance: {entry_id}")

        eligibility = challenge_by_id[challenge_id]["eligibility"]
        checks = (
            (eligibility["size_bands"], coordinate["size_band"], "size band"),
            (eligibility["households"], coordinate["household"], "household"),
            (eligibility["housing_types"], coordinate["housing_type"], "housing type"),
            (eligibility["kinds"], coordinate["kind"], "kind"),
        )
        for allowed, actual, label in checks:
            if allowed and actual not in allowed:
                errors.append(f"{entry_id} violates {label} eligibility")
        if eligibility["budget_max"] is not None and coordinate["budget_max"] > eligibility["budget_max"]:
            errors.append(f"{entry_id} violates budget eligibility")
        if eligibility["image_required"] and not coordinate.get("image_url"):
            errors.append(f"{entry_id} violates image eligibility")
        if len(coordinate["items"]) < eligibility["min_product_count"]:
            errors.append(f"{entry_id} violates product-count eligibility")

    if errors:
        raise SystemExit("Seed validation failed:\n- " + "\n- ".join(errors))
    print(f"Seed validation passed: {len(coordinates)} coordinates, {len(products)} products")
    print(f"Seasonal seed passed: {len(challenges)} challenges, {len(entries)} entries")


if __name__ == "__main__":
    validate()
