from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Challenge, ChallengeEntry, Coordinate, CoordinateItem, CoordinateNeed, Product
from app.schemas.seasonal import ChallengeConstraint, ChallengeEligibility


def seed_if_empty(session: Session, seed_path: Path) -> None:
    payload = json.loads(seed_path.read_text(encoding="utf-8"))
    if session.scalar(select(func.count()).select_from(Product)):
        _repair_stale_built_in_user_provenance(session, payload)
        return
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
            root_coordinate_id=row["id"],
            kind=row["kind"],
            status=row["status"],
            visibility=row["visibility"],
            moderation_status="ACTIVE",
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


def _repair_stale_built_in_user_provenance(session: Session, payload: dict) -> None:
    """Repair the pre-Goal-4D seed bug without touching user-created content."""

    expected = {row["id"]: row for row in payload["coordinates"] if row["id"].startswith("coord-")}
    changed = False
    for coordinate in session.scalars(
        select(Coordinate).where(
            Coordinate.id.in_(expected),
            Coordinate.owner_session_id.is_(None),
            Coordinate.creator_id.is_(None),
            Coordinate.provenance == "USER_DECLARED",
        )
    ):
        row = expected[coordinate.id]
        coordinate.provenance = row["provenance"]
        coordinate.verification_state = row["verification_state"]
        coordinate.creator_display = row["creator_display"]
        coordinate.creator_type = row["creator_type"]
        changed = True
    if changed:
        session.commit()


def seed_seasonal_if_empty(session: Session, seed_path: Path) -> None:
    if session.scalar(select(func.count()).select_from(Challenge)):
        return
    payload = json.loads(seed_path.read_text(encoding="utf-8"))
    valid_statuses = {"UPCOMING", "ACTIVE", "ENDED", "ARCHIVED"}
    valid_seasons = {"SPRING", "SUMMER", "AUTUMN", "WINTER"}
    valid_types = {"LIFE_EVENT", "CONSTRAINT", "ADAPT_REMIX"}
    valid_entry_statuses = {"ACTIVE", "WITHDRAWN", "HIDDEN"}
    valid_recognitions = {
        "OFFICIAL_PICK",
        "USEFUL_REUSE",
        "SMART_BUDGET",
        "SMALL_SPACE_IDEA",
        "EXISTING_FURNITURE",
        "REAL_ROOM_STORY",
    }
    for row in payload["challenges"]:
        if row["status"] not in valid_statuses or row["season"] not in valid_seasons:
            raise ValueError(f"Invalid seasonal status or season: {row['id']}")
        if row["challenge_type"] not in valid_types or row.get("provenance") != "DEMO":
            raise ValueError(f"Invalid Challenge type or provenance: {row['id']}")
        if not (_datetime(row["start_at"]) < _datetime(row["end_at"]) < _datetime(row["archive_at"])):
            raise ValueError(f"Invalid Challenge date order: {row['id']}")
        eligibility = ChallengeEligibility.model_validate(row["eligibility"])
        constraints = [ChallengeConstraint.model_validate(item) for item in row["constraints"]]
        session.add(
            Challenge(
                id=row["id"],
                slug=row["slug"],
                title=row["title"],
                description=row["description"],
                why_it_matters=row["why_it_matters"],
                theme=row["theme"],
                season=row["season"],
                year=row["year"],
                challenge_type=row["challenge_type"],
                status=row["status"],
                start_at=_datetime(row["start_at"]),
                end_at=_datetime(row["end_at"]),
                archive_at=_datetime(row["archive_at"]),
                cover_asset=row["cover_asset"],
                eligibility_json=json.dumps(eligibility.model_dump(), ensure_ascii=False, sort_keys=True),
                constraints_json=json.dumps(
                    [item.model_dump() for item in constraints], ensure_ascii=False, sort_keys=True
                ),
                provenance="DEMO",
            )
        )
    session.flush()
    for row in payload["entries"]:
        if not session.get(Challenge, row["challenge_id"]):
            raise ValueError(f"Seasonal entry references missing Challenge: {row['challenge_id']}")
        if not session.get(Coordinate, row["coordinate_id"]):
            raise ValueError(f"Seasonal entry references missing Coordinate: {row['coordinate_id']}")
        if row["status"] not in valid_entry_statuses or row.get("provenance") != "DEMO":
            raise ValueError(f"Invalid seasonal Entry state or provenance: {row['id']}")
        recognition = row.get("recognition")
        if recognition is not None and recognition not in valid_recognitions:
            raise ValueError(f"Invalid seasonal recognition: {recognition}")
        session.add(
            ChallengeEntry(
                id=row["id"],
                challenge_id=row["challenge_id"],
                coordinate_id=row["coordinate_id"],
                creator_id=None,
                submitted_at=_datetime(row["submitted_at"]),
                status=row["status"],
                recognition=recognition,
                provenance=row["provenance"],
            )
        )
    session.commit()


def _product_price(payload: dict, product_id: str) -> int | None:
    return next(row["price_snapshot"] for row in payload["products"] if row["id"] == product_id)


def _product_observed_at(payload: dict, product_id: str) -> datetime | None:
    value = next(row["price_observed_at"] for row in payload["products"] if row["id"] == product_id)
    return _datetime(value)


def _datetime(value: str | None) -> datetime | None:
    return datetime.fromisoformat(value) if value else None
