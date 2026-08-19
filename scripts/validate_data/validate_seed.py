from __future__ import annotations

import hashlib
import json
from datetime import datetime
from pathlib import Path
from urllib.parse import urlsplit

from PIL import Image


ROOT = Path(__file__).resolve().parents[2]
SEED = ROOT / "data" / "seed" / "demo_seed.json"
SEASONAL_SEED = ROOT / "data" / "seed" / "seasonal_seed.json"
VISUAL_MANIFEST = ROOT / "data" / "seed" / "visual_asset_manifest.json"
PRODUCT_MANIFEST = ROOT / "data" / "seed" / "product_asset_manifest.json"
HERO_MANIFEST = ROOT / "data" / "seed" / "hero_asset_manifest.json"
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


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def validate() -> None:
    payload = json.loads(SEED.read_text(encoding="utf-8"))
    seasonal_payload = json.loads(SEASONAL_SEED.read_text(encoding="utf-8"))
    visual_manifest = json.loads(VISUAL_MANIFEST.read_text(encoding="utf-8"))
    product_manifest = json.loads(PRODUCT_MANIFEST.read_text(encoding="utf-8"))
    hero_manifest = json.loads(HERO_MANIFEST.read_text(encoding="utf-8"))
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
        official_url = urlsplit(product["official_url"])
        if (
            official_url.scheme != "https"
            or official_url.hostname != "www.nitori-net.jp"
            or official_url.username
            or official_url.password
        ):
            errors.append(f"unexpected official URL: {product['id']}")
        if product["provenance"] == "NITORI_OFFICIAL_SNAPSHOT":
            if not product["id"].startswith("NTR-"):
                errors.append(f"official snapshot product must use an NTR ID: {product['id']}")
            if not official_url.path.startswith("/ec/product/"):
                errors.append(f"official snapshot must link to its product page: {product['id']}")
            if product["rights_status"] != "EXPLICITLY_PERMITTED":
                errors.append(f"official product visual must be explicitly permitted: {product['id']}")
            if product["price_status"] != "NITORI_OFFICIAL_SNAPSHOT":
                errors.append(f"official product has wrong price status: {product['id']}")
        else:
            if product["provenance"] != "DEMO" or not product["id"].startswith("DEMO-"):
                errors.append(f"unexpected fallback product provenance or ID: {product['id']}")
            if not official_url.path.startswith("/ec/search/"):
                errors.append(f"demo fallback must link only to an official search: {product['id']}")
        asset = local_asset(product["image_url"])
        if asset is None:
            errors.append(f"external product image is not allowed: {product['id']}")
        elif not asset.is_file():
            errors.append(f"missing product asset: {product['id']}")
        elif product["provenance"] == "NITORI_OFFICIAL_SNAPSHOT":
            if asset.suffix.lower() != ".webp":
                errors.append(f"official product visual must be WebP: {product['id']}")
            else:
                try:
                    with Image.open(asset) as image:
                        if image.size != (640, 640):
                            errors.append(f"official product visual must be 640x640: {product['id']} is {image.size}")
                except OSError:
                    errors.append(f"unreadable official product visual: {product['id']}")
                if asset.stat().st_size > 200_000:
                    errors.append(f"official product visual is unexpectedly large: {product['id']}")
        if (product["price_snapshot"] is None) != (product["price_status"] == "MISSING"):
            errors.append(f"inconsistent missing price state: {product['id']}")

    product_rows = product_manifest.get("products", [])
    if len(product_rows) != 18:
        errors.append(f"product manifest must contain the curated 18-item set, found {len(product_rows)}")
    if len({row.get("id") for row in product_rows}) != len(product_rows):
        errors.append("duplicate product ID in product manifest")
    if len({row.get("local_asset") for row in product_rows}) != len(product_rows):
        errors.append("curated products must have distinct local assets")
    product_asset_paths = [local_asset(str(row.get("local_asset", ""))) for row in product_rows]
    existing_product_assets = [path for path in product_asset_paths if path is not None and path.is_file()]
    if len(existing_product_assets) == len(product_rows) and len({sha256(path) for path in existing_product_assets}) != len(product_rows):
        errors.append("curated product image contents must be non-repeating")
    manifest_categories: dict[str, int] = {}
    product_by_id = {product["id"]: product for product in products}
    for row in product_rows:
        product_id = str(row.get("id", ""))
        seeded = product_by_id.get(product_id)
        manifest_categories[str(row.get("category", ""))] = manifest_categories.get(str(row.get("category", "")), 0) + 1
        if seeded is None:
            errors.append(f"product manifest item missing from seed: {product_id}")
            continue
        for manifest_key, seed_key in (
            ("name", "name"),
            ("category", "category"),
            ("default_role", "default_role"),
            ("price_snapshot", "price_snapshot"),
            ("official_url", "official_url"),
            ("local_asset", "image_url"),
        ):
            if row.get(manifest_key) != seeded.get(seed_key):
                errors.append(f"product seed/manifest {manifest_key} mismatch: {product_id}")
        source_asset = urlsplit(str(row.get("source_asset_url", "")))
        if source_asset.scheme != "https" or source_asset.hostname != "www.nitori-net.jp":
            errors.append(f"product source asset must be official NITORI HTTPS: {product_id}")
        if not str(row.get("source_product_code", "")).strip():
            errors.append(f"missing source product code: {product_id}")
    if set(manifest_categories) != {"BED", "DESK", "STORAGE", "LIGHTING", "TEXTILE", "SUPPORT"}:
        errors.append("product manifest does not cover all six categories")
    if any(count != 3 for count in manifest_categories.values()):
        errors.append(f"product manifest must contain three products per category: {manifest_categories}")

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
    coordinate_asset_paths = [local_asset(str(path)) for path in current_assets]
    existing_coordinate_assets = [path for path in coordinate_asset_paths if path is not None and path.is_file()]
    if len(existing_coordinate_assets) == len(visual_rows) and len({sha256(path) for path in existing_coordinate_assets}) != len(visual_rows):
        errors.append("main demo coordinate image contents must be non-repeating")
    fallback = local_asset(str(visual_manifest.get("fallback_asset", "")))
    if fallback is None or not fallback.is_file():
        errors.append("visual manifest fallback asset is missing or external")
    source_page = urlsplit(str(visual_manifest.get("source_page_url", "")))
    if source_page.scheme != "https" or source_page.hostname != "www.nitori-net.jp":
        errors.append("visual manifest source page must be an official HTTPS NITORI URL")
    for row in visual_rows:
        coordinate_id = str(row.get("coordinate_id", ""))
        coordinate = coordinate_by_id.get(coordinate_id)
        if coordinate is None:
            errors.append(f"unknown coordinate in visual manifest: {coordinate_id}")
            continue
        if row.get("rights_status") not in ALLOWED_RIGHTS:
            errors.append(f"unsafe visual manifest rights: {coordinate_id}")
        if row.get("rights_status") != "EXPLICITLY_PERMITTED":
            errors.append(f"priority NITORI visual must be explicitly permitted: {coordinate_id}")
        if row.get("asset_type") != "NITORI_APPROVED_COORDINATE":
            errors.append(f"unexpected priority visual asset type: {coordinate_id}")
        if row.get("permission_basis") != "USER_CONFIRMED_FOR_THIS_PROTOTYPE":
            errors.append(f"missing permission basis: {coordinate_id}")
        if not row.get("primary_demo_usage"):
            errors.append(f"missing primary demo usage: {coordinate_id}")
        if not str(row.get("visual_fit", "")).strip():
            errors.append(f"missing visual fit note: {coordinate_id}")
        current_asset = local_asset(str(row.get("current_asset", "")))
        if current_asset is None or not current_asset.is_file():
            errors.append(f"missing current visual asset: {coordinate_id}")
        elif current_asset.suffix.lower() != ".webp":
            errors.append(f"priority visual must be an optimized WebP: {coordinate_id}")
        else:
            try:
                with Image.open(current_asset) as image:
                    if image.size != (640, 400):
                        errors.append(f"priority visual must be 640x400: {coordinate_id} is {image.size}")
            except OSError:
                errors.append(f"unreadable priority visual: {coordinate_id}")
            if current_asset.stat().st_size > 200_000:
                errors.append(f"priority visual is unexpectedly large: {coordinate_id}")
        row_fallback = local_asset(str(row.get("fallback_asset", "")))
        if row_fallback is None or not row_fallback.is_file() or row_fallback.suffix.lower() != ".svg":
            errors.append(f"missing repository-original SVG fallback: {coordinate_id}")
        if coordinate.get("image_url") != row.get("current_asset"):
            errors.append(f"seed/manifest image mismatch: {coordinate_id}")
        if coordinate.get("image_rights") != row.get("rights_status"):
            errors.append(f"seed/manifest image rights mismatch: {coordinate_id}")
        if row.get("coordinate_title") != coordinate.get("title"):
            errors.append(f"seed/manifest title mismatch: {coordinate_id}")
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
        source_asset = urlsplit(str(row.get("source_asset_url", "")))
        if source_asset.scheme != "https" or source_asset.hostname != "www.nitori-net.jp":
            errors.append(f"source asset must be an official HTTPS NITORI URL: {coordinate_id}")
        if not str(row.get("source_image_name", "")).strip():
            errors.append(f"missing source image name: {coordinate_id}")

    hero_rows = hero_manifest.get("slides", [])
    if not 3 <= len(hero_rows) <= 4:
        errors.append(f"hero manifest needs 3-4 slides, found {len(hero_rows)}")
    if len({row.get("local_asset") for row in hero_rows}) != len(hero_rows):
        errors.append("hero slides must have distinct local assets")
    hero_asset_paths = [local_asset(str(row.get("local_asset", ""))) for row in hero_rows]
    existing_hero_assets = [path for path in hero_asset_paths if path is not None and path.is_file()]
    if len(existing_hero_assets) == len(hero_rows) and len({sha256(path) for path in existing_hero_assets}) != len(hero_rows):
        errors.append("hero image contents must be non-repeating")
    hero_page = urlsplit(str(hero_manifest.get("source_page_url", "")))
    if hero_page.scheme != "https" or hero_page.hostname != "www.nitori-net.jp":
        errors.append("hero manifest source page must be an official NITORI URL")
    for row in hero_rows:
        slide_id = str(row.get("id", ""))
        if row.get("rights_status") != "EXPLICITLY_PERMITTED":
            errors.append(f"hero slide must be explicitly permitted: {slide_id}")
        source_asset = urlsplit(str(row.get("source_asset_url", "")))
        if source_asset.scheme != "https" or source_asset.hostname != "www.nitori-net.jp":
            errors.append(f"hero source asset must be official NITORI HTTPS: {slide_id}")
        asset = local_asset(str(row.get("local_asset", "")))
        if asset is None or not asset.is_file() or asset.suffix.lower() != ".webp":
            errors.append(f"hero asset must be a local WebP: {slide_id}")
            continue
        try:
            with Image.open(asset) as image:
                if image.size != (1200, 750):
                    errors.append(f"hero asset must be 1200x750: {slide_id} is {image.size}")
        except OSError:
            errors.append(f"unreadable hero asset: {slide_id}")
        if asset.stat().st_size > 250_000:
            errors.append(f"hero asset is unexpectedly large: {slide_id}")

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
