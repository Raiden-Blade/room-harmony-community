from __future__ import annotations

from datetime import datetime, timezone

from app.models import Coordinate
from app.schemas.common import PriceSummary


def calculate_price(coordinate: Coordinate) -> PriceSummary:
    to_buy = [item for item in coordinate.items if item.source == "CATALOG_TO_BUY"]
    known_total = sum((item.price_snapshot or 0) * item.quantity for item in to_buy if item.price_snapshot is not None)
    unknown = sum(1 for item in to_buy if item.price_snapshot is None)
    return PriceSummary(
        known_total=known_total,
        unknown_item_count=unknown,
        calculated_at=datetime.now(timezone.utc),
        status="PARTIAL_DEMO_SNAPSHOT" if unknown else "DEMO_SNAPSHOT",
    )
