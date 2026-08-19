from __future__ import annotations

import json
from pathlib import Path


REPOSITORY_DIR = Path(__file__).resolve().parents[3]
SEED_PATH = REPOSITORY_DIR / "data" / "seed" / "demo_seed.json"
BUILT_IN_PROVENANCES = {"DEMO", "STAFF", "OFFICIAL"}
VERIFIED_OFFICIAL_PRODUCT_STYLES = {"NATURAL", "CLEAR_COOL", "DANDY"}
UNVERIFIED_COORDINATE_STYLES = {"ELEGANT", "COZY", "COLORFUL"}


def _seed() -> dict:
    return json.loads(SEED_PATH.read_text(encoding="utf-8"))


def test_built_in_coordinates_never_use_user_declared_provenance():
    coordinates = _seed()["coordinates"]

    assert coordinates
    assert all(coordinate["kind"] == "PLAN" for coordinate in coordinates)
    assert all(coordinate["provenance"] in BUILT_IN_PROVENANCES for coordinate in coordinates)
    assert all(coordinate["verification_state"] == "DEMO_ONLY" for coordinate in coordinates)


def test_product_style_compatibility_is_explicit_and_never_wraps_unsupported_styles():
    payload = _seed()
    products = {product["id"]: product for product in payload["products"]}

    for coordinate in payload["coordinates"]:
        compatibility_states = {item["style_compatibility"] for item in coordinate["items"]}
        if coordinate["style"] in UNVERIFIED_COORDINATE_STYLES:
            assert "VERIFIED_MATCH" not in compatibility_states
        else:
            assert coordinate["style"] in VERIFIED_OFFICIAL_PRODUCT_STYLES
            assert "VERIFIED_MATCH" in compatibility_states

        for item in coordinate["items"]:
            product = products[item["product_id"]]
            verified_match = (
                product["provenance"] == "NITORI_OFFICIAL_SNAPSHOT"
                and coordinate["style"] in VERIFIED_OFFICIAL_PRODUCT_STYLES
                and product["style_hint"] == coordinate["style"]
            )
            expected = (
                "VERIFIED_MATCH"
                if verified_match
                else "UNVERIFIED_NEUTRAL"
                if product["provenance"] == "NITORI_OFFICIAL_SNAPSHOT"
                else "DEMO_ONLY"
            )
            assert item["style_compatibility"] == expected
