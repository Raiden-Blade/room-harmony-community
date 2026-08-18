from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Coordinate, CoordinateItem, CoordinateSave
from app.schemas.common import CoordinateDetail, CoordinateItemResponse, CoordinateSummary, ProductSummary
from app.services.pricing import calculate_price


def is_saved(session: Session, session_id: str, coordinate_id: str) -> bool:
    return session.scalar(
        select(CoordinateSave.id).where(
            CoordinateSave.session_id == session_id,
            CoordinateSave.coordinate_id == coordinate_id,
        )
    ) is not None


def product_summary(item: CoordinateItem) -> ProductSummary | None:
    return ProductSummary.model_validate(item.product) if item.product else None


def coordinate_summary(
    coordinate: Coordinate,
    session: Session,
    session_id: str,
    score: int | None = None,
    reasons: list[str] | None = None,
) -> CoordinateSummary:
    categories = {item.product.category for item in coordinate.items if item.product}
    return CoordinateSummary(
        id=coordinate.id,
        kind=coordinate.kind,
        status=coordinate.status,
        title=coordinate.title,
        description=coordinate.description,
        room_type=coordinate.room_type,
        size_band=coordinate.size_band,
        housing_type=coordinate.housing_type,
        household=coordinate.household,
        budget_band=coordinate.budget_band,
        budget_max=coordinate.budget_max,
        style=coordinate.style,
        needs=[need.need_code for need in coordinate.needs],
        provenance=coordinate.provenance,
        verification_state=coordinate.verification_state,
        creator_display=coordinate.creator_display,
        creator_type=coordinate.creator_type,
        image_url=coordinate.image_url,
        image_rights=coordinate.image_rights,
        demo_disclosure=coordinate.demo_disclosure,
        seasonal_collection=coordinate.seasonal_collection,
        official_pick=coordinate.official_pick,
        price=calculate_price(coordinate),
        product_count=sum(1 for item in coordinate.items if item.product),
        category_count=len(categories),
        match_reasons=reasons or [],
        score=score,
        is_saved=is_saved(session, session_id, coordinate.id),
    )


def coordinate_detail(
    coordinate: Coordinate,
    session: Session,
    session_id: str,
    reasons: list[str] | None = None,
) -> CoordinateDetail:
    summary = coordinate_summary(coordinate, session, session_id, reasons=reasons)
    return CoordinateDetail(
        **summary.model_dump(),
        parent_coordinate_id=coordinate.parent_coordinate_id,
        owner_session_id=coordinate.owner_session_id,
        items=[
            CoordinateItemResponse(
                id=item.id,
                role=item.role,
                source=item.source,
                quantity=item.quantity,
                price_snapshot=item.price_snapshot,
                price_observed_at=item.price_observed_at,
                existing_label=item.existing_label,
                dimensions=item.dimensions,
                mutation_state=item.mutation_state,
                product=product_summary(item),
            )
            for item in coordinate.items
        ],
        creator_impact_slot={
            "enabled": coordinate.ready_for_creator_impact,
            "helpful_count": None,
            "saved_count": None,
            "adaptation_count": None,
        },
    )
