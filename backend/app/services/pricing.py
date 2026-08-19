from __future__ import annotations

from datetime import datetime, timezone

from app.models import Coordinate
from app.schemas.common import PriceSummary


def calculate_price(coordinate: Coordinate) -> PriceSummary:
    to_buy = [item for item in coordinate.items if item.source == "CATALOG_TO_BUY"]
    known_total = sum((item.price_snapshot or 0) * item.quantity for item in to_buy if item.price_snapshot is not None)
    unknown = sum(1 for item in to_buy if item.price_snapshot is None)
    official_count = sum(
        1 for item in to_buy if item.product and item.product.provenance == "NITORI_OFFICIAL_SNAPSHOT"
    )
    if official_count == len(to_buy) and to_buy:
        status = "PARTIAL_NITORI_OFFICIAL_SNAPSHOT" if unknown else "NITORI_OFFICIAL_SNAPSHOT"
        notice = "表示価格はNITORI公式商品ページを基準にした日付付き参照スナップショットです。現在価格・在庫と異なる場合があります。"
    elif official_count:
        status = "MIXED_SNAPSHOT"
        notice = "NITORI公式参照価格と架空のデモ価格が混在しています。現在価格・在庫を示しません。"
    else:
        status = "PARTIAL_DEMO_SNAPSHOT" if unknown else "DEMO_SNAPSHOT"
        notice = "表示価格は架空のデモ用スナップショットです。現在の公式価格・在庫を示しません。"
    return PriceSummary(
        known_total=known_total,
        unknown_item_count=unknown,
        calculated_at=datetime.now(timezone.utc),
        status=status,
        notice=notice,
    )
