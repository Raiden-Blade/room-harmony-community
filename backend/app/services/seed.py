from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Coordinate, CoordinateItem, CoordinateNeed, Product


def seed_if_empty(session: Session, seed_path: Path) -> None:
    if session.scalar(select(func.count()).select_from(Product)):
        return
    payload = json.loads(seed_path.read_text(encoding="utf-8"))
    for row in payload["products"]:
        session.add(
            Product(
                id=row["id"],
                name=row["name"],
                category=row["category"],
                default_role=row["default_role"],
                price_snapshot=row["price_snapshot"],
                price_status=row["price_status"],
                price_observed_at=_datetime(row.get("price_observed_at")),
                official_url=row["official_url"],
                image_url=row["image_url"],
                provenance=row["provenance"],
                rights_status=row["rights_status"],
            )
        )
    session.flush()
    for row in payload["coordinates"]:
        coordinate = Coordinate(
            id=row["id"],
            kind=row["kind"],
            status=row["status"],
            visibility=row["visibility"],
            title=row["title"],
            description=row["description"],
            room_type=row["room_type"],
            size_band=row["size_band"],
            housing_type=row["housing_type"],
            household=row["household"],
            budget_band=row["budget_band"],
            budget_max=row["budget_max"],
            style=row["style"],
            provenance=row["provenance"],
            verification_state=row["verification_state"],
            creator_display=row["creator_display"],
            creator_type=row["creator_type"],
            image_url=row["image_url"],
            image_rights=row["image_rights"],
            demo_disclosure=row["demo_disclosure"],
            seasonal_collection=row.get("seasonal_collection"),
            editorial_rank=row["editorial_rank"],
            official_pick=row["official_pick"],
            seasonal_recognition=row.get("seasonal_recognition"),
            ready_for_creator_impact=True,
        )
        coordinate.needs = [CoordinateNeed(need_code=code) for code in row["needs"]]
        coordinate.items = [
            CoordinateItem(
                product_id=item["product_id"],
                role=item["role"],
                source=item["source"],
                quantity=item["quantity"],
                price_snapshot=_product_price(payload, item["product_id"]),
                price_observed_at=_product_observed_at(payload, item["product_id"]),
                mutation_state="ORIGINAL",
                position=item["position"],
            )
            for item in row["items"]
        ]
        for existing in row.get("existing_furniture", []):
            coordinate.items.append(
                CoordinateItem(
                    role=existing["category"],
                    source="EXISTING_EXTERNAL",
                    quantity=1,
                    existing_label=existing["label"],
                    dimensions=existing.get("dimensions"),
                    mutation_state="ORIGINAL",
                    position=len(coordinate.items),
                )
            )
        session.add(coordinate)
    session.commit()


def _product_price(payload: dict, product_id: str) -> int | None:
    return next(row["price_snapshot"] for row in payload["products"] if row["id"] == product_id)


def _product_observed_at(payload: dict, product_id: str) -> datetime | None:
    value = next(row["price_observed_at"] for row in payload["products"] if row["id"] == product_id)
    return _datetime(value)


def _datetime(value: str | None) -> datetime | None:
    return datetime.fromisoformat(value) if value else None
