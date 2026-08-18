from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Coordinate, CoordinateItem, CoordinateSave
from app.schemas.common import (
    CoordinateDetail,
    CoordinateItemResponse,
    CoordinateSummary,
    GenealogyNode,
    GenealogySummary,
    ProductSummary,
)
from app.services.community import coordinate_impact, helpful_count, is_helpful
from app.services.images import image_url
from app.services.pricing import calculate_price
from app.services.seasonal import coordinate_challenge_contexts, coordinate_challenge_options


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
    uploaded_urls = [image_url(item) for item in coordinate.images]
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
        creator_id=coordinate.creator_id,
        image_url=coordinate.image_url,
        image_urls=uploaded_urls or [coordinate.image_url],
        image_rights=coordinate.image_rights,
        demo_disclosure=coordinate.demo_disclosure,
        seasonal_collection=coordinate.seasonal_collection,
        official_pick=coordinate.official_pick,
        root_coordinate_id=coordinate.root_coordinate_id,
        derivation_type=coordinate.derivation_type,
        moderation_status=coordinate.moderation_status,
        price=calculate_price(coordinate),
        product_count=sum(1 for item in coordinate.items if item.product),
        category_count=len(categories),
        match_reasons=reasons or [],
        score=score,
        is_saved=is_saved(session, session_id, coordinate.id),
        helpful_count=helpful_count(session, coordinate.id),
        is_helpful=is_helpful(session, session_id, coordinate.id),
        can_edit=coordinate.owner_session_id == session_id and coordinate.creator_id is not None,
    )


def coordinate_detail(
    coordinate: Coordinate,
    session: Session,
    session_id: str,
    reasons: list[str] | None = None,
) -> CoordinateDetail:
    summary = coordinate_summary(coordinate, session, session_id, reasons=reasons)
    genealogy = coordinate_genealogy(coordinate, session, session_id)
    impact = coordinate_impact(session, coordinate)
    visible_parent_id = genealogy.parent.id if genealogy.parent and genealogy.parent.available else None
    return CoordinateDetail(
        **summary.model_dump(),
        parent_coordinate_id=visible_parent_id,
        remix_note=coordinate.remix_note,
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
            "helpful_count": impact.helpful_count,
            "saved_count": impact.saved_count,
            "adaptation_count": impact.public_adaptation_count,
        },
        creator_impact=impact,
        genealogy=genealogy,
        challenge_contexts=coordinate_challenge_contexts(session, coordinate.id),
        challenge_options=coordinate_challenge_options(session, session_id, coordinate),
    )


def coordinate_genealogy(
    coordinate: Coordinate,
    session: Session,
    session_id: str,
) -> GenealogySummary:
    parent = session.get(Coordinate, coordinate.parent_coordinate_id) if coordinate.parent_coordinate_id else None
    root = session.get(Coordinate, coordinate.root_coordinate_id) if coordinate.root_coordinate_id else None
    children = list(
        session.scalars(
            select(Coordinate)
            .where(
                Coordinate.parent_coordinate_id == coordinate.id,
                Coordinate.visibility == "PUBLIC",
                Coordinate.moderation_status == "ACTIVE",
            )
            .order_by(Coordinate.published_at.desc(), Coordinate.created_at.desc())
        ).all()
    )
    private_plan_count = session.scalar(
        select(func.count())
        .select_from(Coordinate)
        .where(
            Coordinate.parent_coordinate_id == coordinate.id,
            Coordinate.kind == "PLAN",
            Coordinate.visibility == "PRIVATE",
        )
    ) or 0
    public_adaptation_count = session.scalar(
        select(func.count())
        .select_from(Coordinate)
        .where(
            Coordinate.root_coordinate_id == coordinate.id,
            Coordinate.id != coordinate.id,
            Coordinate.visibility == "PUBLIC",
            Coordinate.moderation_status == "ACTIVE",
        )
    ) or 0
    return GenealogySummary(
        parent=_genealogy_node(parent, session_id),
        root=_genealogy_node(root, session_id),
        plan_started_count=private_plan_count,
        public_adaptation_count=public_adaptation_count,
        public_children=[_genealogy_node(child, session_id) for child in children],
    )


def _genealogy_node(coordinate: Coordinate | None, session_id: str) -> GenealogyNode | None:
    if not coordinate:
        return None
    available = (
        coordinate.visibility == "PUBLIC" and coordinate.moderation_status == "ACTIVE"
    ) or coordinate.owner_session_id == session_id
    return GenealogyNode(
        id=coordinate.id if available else None,
        title=coordinate.title if available else "非公開の参考元",
        kind=coordinate.kind if available else None,
        available=available,
    )
