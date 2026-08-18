from app.models import Coordinate, CoordinateItem
from app.services.pricing import calculate_price


def test_total_excludes_existing_and_preserves_missing_price():
    coordinate = Coordinate(
        id="test",
        kind="PLAN",
        status="DRAFT",
        title="test",
        description="test",
        room_type="ONE_ROOM",
        size_band="SMALL_6",
        housing_type="RENTAL",
        household="SINGLE",
        budget_band="UNDER_50000",
        budget_max=50_000,
        style="NATURAL",
        provenance="DEMO",
        verification_state="DEMO_ONLY",
        creator_display="demo",
        creator_type="DEMO",
        image_url="/demo.svg",
        image_rights="LOCALLY_CREATED_DEMO",
        demo_disclosure="demo",
    )
    coordinate.items = [
        CoordinateItem(role="STORAGE", source="CATALOG_TO_BUY", quantity=2, price_snapshot=4_000),
        CoordinateItem(role="LIGHTING", source="CATALOG_TO_BUY", quantity=1, price_snapshot=None),
        CoordinateItem(role="OTHER", source="EXISTING_EXTERNAL", quantity=1, existing_label="chair"),
    ]

    summary = calculate_price(coordinate)

    assert summary.known_total == 8_000
    assert summary.unknown_item_count == 1
    assert summary.status == "PARTIAL_DEMO_SNAPSHOT"
