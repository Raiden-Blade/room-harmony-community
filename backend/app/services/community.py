from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.models import (
    ContentReport,
    Coordinate,
    CoordinateImage,
    CoordinateItem,
    CoordinateNeed,
    CoordinateSave,
    CreatorProfile,
    HelpfulReaction,
    Product,
)
from app.schemas.common import CreatorImpactSummary
from app.schemas.community import (
    CoordinateUpdateRequest,
    CreateCoordinateRequest,
    CreatorUpsertRequest,
    PublishPlanRequest,
)
from app.services.images import image_url
from app.services.plans import load_coordinate, require_owned_plan
from app.services.seasonal import withdraw_entries_for_coordinate


def creator_for_session(session: Session, session_id: str) -> CreatorProfile | None:
    return session.scalar(select(CreatorProfile).where(CreatorProfile.owner_session_id == session_id))


def upsert_creator(session: Session, session_id: str, payload: CreatorUpsertRequest) -> CreatorProfile:
    creator = creator_for_session(session, session_id)
    if creator:
        creator.display_name = payload.display_name
        creator.bio = payload.bio or None
    else:
        creator = CreatorProfile(
            id=f"creator-{uuid4()}",
            owner_session_id=session_id,
            display_name=payload.display_name,
            bio=payload.bio or None,
        )
        session.add(creator)
    session.commit()
    return creator


def require_creator(session: Session, session_id: str) -> CreatorProfile:
    creator = creator_for_session(session, session_id)
    if not creator:
        raise HTTPException(status_code=409, detail="Create a display identity before publishing")
    return creator


def load_creator(session: Session, creator_id: str) -> CreatorProfile:
    creator = session.get(CreatorProfile, creator_id)
    if not creator:
        raise HTTPException(status_code=404, detail="Creator not found")
    return creator


def creator_coordinates(session: Session, creator_id: str) -> list[Coordinate]:
    return list(
        session.scalars(
            select(Coordinate)
            .where(
                Coordinate.creator_id == creator_id,
                Coordinate.visibility == "PUBLIC",
                Coordinate.moderation_status == "ACTIVE",
            )
            .order_by(Coordinate.published_at.desc(), Coordinate.created_at.desc())
        ).all()
    )


def impact_for_coordinates(session: Session, coordinate_ids: list[str]) -> CreatorImpactSummary:
    if not coordinate_ids:
        return CreatorImpactSummary(
            published_coordinates=0,
            helpful_count=0,
            saved_count=0,
            plan_started_count=0,
            public_adaptation_count=0,
            real_room_contributions=0,
        )
    helpful = session.scalar(
        select(func.count()).select_from(HelpfulReaction).where(HelpfulReaction.coordinate_id.in_(coordinate_ids))
    ) or 0
    saved = session.scalar(
        select(func.count()).select_from(CoordinateSave).where(CoordinateSave.coordinate_id.in_(coordinate_ids))
    ) or 0
    plans = session.scalar(
        select(func.count())
        .select_from(Coordinate)
        .where(
            Coordinate.parent_coordinate_id.in_(coordinate_ids),
            Coordinate.kind == "PLAN",
            Coordinate.visibility == "PRIVATE",
            Coordinate.owner_session_id.is_not(None),
        )
    ) or 0
    adaptations = session.scalar(
        select(func.count())
        .select_from(Coordinate)
        .where(
            Coordinate.root_coordinate_id.in_(coordinate_ids),
            Coordinate.id != Coordinate.root_coordinate_id,
            Coordinate.visibility == "PUBLIC",
            Coordinate.moderation_status == "ACTIVE",
        )
    ) or 0
    real_rooms = session.scalar(
        select(func.count())
        .select_from(Coordinate)
        .where(
            Coordinate.id.in_(coordinate_ids),
            Coordinate.kind == "REAL",
            Coordinate.visibility == "PUBLIC",
            Coordinate.moderation_status == "ACTIVE",
        )
    ) or 0
    return CreatorImpactSummary(
        published_coordinates=len(coordinate_ids),
        helpful_count=helpful,
        saved_count=saved,
        plan_started_count=plans,
        public_adaptation_count=adaptations,
        real_room_contributions=real_rooms,
    )


def coordinate_impact(session: Session, coordinate: Coordinate) -> CreatorImpactSummary:
    helpful = helpful_count(session, coordinate.id)
    saved = session.scalar(
        select(func.count()).select_from(CoordinateSave).where(CoordinateSave.coordinate_id == coordinate.id)
    ) or 0
    plans = session.scalar(
        select(func.count())
        .select_from(Coordinate)
        .where(
            Coordinate.parent_coordinate_id == coordinate.id,
            Coordinate.kind == "PLAN",
            Coordinate.owner_session_id.is_not(None),
            Coordinate.visibility == "PRIVATE",
        )
    ) or 0
    adaptations = session.scalar(
        select(func.count())
        .select_from(Coordinate)
        .where(
            Coordinate.root_coordinate_id == coordinate.id,
            Coordinate.id != coordinate.id,
            Coordinate.visibility == "PUBLIC",
            Coordinate.moderation_status == "ACTIVE",
        )
    ) or 0
    return CreatorImpactSummary(
        published_coordinates=1 if coordinate.visibility == "PUBLIC" else 0,
        helpful_count=helpful,
        saved_count=saved,
        plan_started_count=plans,
        public_adaptation_count=adaptations,
        real_room_contributions=1 if coordinate.kind == "REAL" and coordinate.visibility == "PUBLIC" else 0,
    )


def create_public_coordinate(
    session: Session,
    session_id: str,
    payload: CreateCoordinateRequest,
) -> Coordinate:
    creator = require_creator(session, session_id)
    if payload.kind == "REAL" and not payload.image_ids:
        raise HTTPException(status_code=422, detail="A public REAL ROOM requires at least one room image")
    coordinate_id = f"community-{uuid4()}"
    parent, root_id = resolve_parent(session, session_id, payload.parent_coordinate_id, coordinate_id)
    if parent and not payload.derivation_type:
        raise HTTPException(status_code=422, detail="A derivative Coordinate requires a structured reason")

    products = _products(session, payload.products)
    images = _owned_images(session, session_id, payload.image_ids)
    primary_url = image_url(images[0]) if images else _fallback_image(products)
    budget_max = payload.budget_max or _known_product_total(products) or 50_000
    coordinate = Coordinate(
        id=coordinate_id,
        owner_session_id=session_id,
        creator_id=creator.id,
        parent_coordinate_id=parent.id if parent else None,
        root_coordinate_id=root_id or coordinate_id,
        derivation_type=payload.derivation_type,
        remix_note=payload.remix_note or None,
        kind=payload.kind,
        status="PUBLISHED",
        visibility="PUBLIC",
        moderation_status="ACTIVE",
        title=payload.title,
        description=payload.description or "暮らしの条件と商品を構造化したUser投稿です。",
        room_type=payload.room_type or "ONE_ROOM",
        size_band=payload.size_band or "UNSPECIFIED",
        housing_type=payload.housing_type or "UNSPECIFIED",
        household=payload.household or "UNSPECIFIED",
        budget_band=_budget_band(budget_max),
        budget_max=budget_max,
        style=payload.style or "UNSPECIFIED",
        provenance="USER_DECLARED",
        verification_state="USER_DECLARED_UNVERIFIED",
        creator_display=creator.display_name,
        creator_type="LOCAL_DEMO_CREATOR",
        image_url=primary_url,
        image_rights="USER_UPLOADED_LOCAL" if images else "LOCALLY_CREATED_DEMO_PLACEHOLDER",
        demo_disclosure=_disclosure(payload.kind),
        editorial_rank=500,
        official_pick=False,
        ready_for_creator_impact=True,
        published_at=datetime.now(timezone.utc),
    )
    coordinate.needs = [CoordinateNeed(need_code=need) for need in payload.needs]
    coordinate.items = _coordinate_items(payload, products)
    session.add(coordinate)
    session.flush()
    _attach_images(images, coordinate)
    session.commit()
    return load_coordinate(session, coordinate.id)


def publish_plan(
    session: Session,
    session_id: str,
    plan_id: str,
    payload: PublishPlanRequest,
) -> Coordinate:
    creator = require_creator(session, session_id)
    plan = require_owned_plan(session, plan_id, session_id)
    if payload.kind == "REAL" and not payload.image_ids:
        raise HTTPException(status_code=422, detail="Publishing as REAL ROOM requires a room image")
    images = _owned_images(session, session_id, payload.image_ids)
    coordinate_id = f"community-{uuid4()}"
    # A public derivative must not silently republish another User's uploaded
    # room photo. Without a new upload, PLAN uses a local demo placeholder.
    primary_url = image_url(images[0]) if images else "/assets/room-natural.svg"
    coordinate = Coordinate(
        id=coordinate_id,
        owner_session_id=session_id,
        creator_id=creator.id,
        parent_coordinate_id=plan.id,
        root_coordinate_id=plan.root_coordinate_id or plan.parent_coordinate_id or plan.id,
        derivation_type=payload.derivation_type,
        remix_note=payload.remix_note or None,
        kind=payload.kind,
        status="PUBLISHED",
        visibility="PUBLIC",
        moderation_status="ACTIVE",
        title=plan.title.removeprefix("自分用："),
        description=(
            "実現後の暮らしとしてUserが申告したREAL ROOMです。"
            if payload.kind == "REAL"
            else "これから実現したい暮らしとして共有されたPLANです。"
        ),
        room_type=plan.room_type,
        size_band=plan.size_band,
        housing_type=plan.housing_type,
        household=plan.household,
        budget_band=plan.budget_band,
        budget_max=plan.budget_max,
        style=plan.style,
        provenance="USER_DECLARED",
        verification_state="USER_DECLARED_UNVERIFIED",
        creator_display=creator.display_name,
        creator_type="LOCAL_DEMO_CREATOR",
        image_url=primary_url,
        image_rights="USER_UPLOADED_LOCAL" if images else "LOCALLY_CREATED_DEMO_PLACEHOLDER",
        demo_disclosure=_disclosure(payload.kind),
        seasonal_collection=plan.seasonal_collection,
        editorial_rank=500,
        official_pick=False,
        ready_for_creator_impact=True,
        published_at=datetime.now(timezone.utc),
    )
    coordinate.needs = [CoordinateNeed(need_code=item.need_code) for item in plan.needs]
    coordinate.items = [_clone_item(item) for item in plan.items]
    session.add(coordinate)
    session.flush()
    _attach_images(images, coordinate)
    session.commit()
    return load_coordinate(session, coordinate.id)


def update_owned_coordinate(
    session: Session,
    session_id: str,
    coordinate_id: str,
    payload: CoordinateUpdateRequest,
) -> Coordinate:
    coordinate = require_owned_public_coordinate(session, session_id, coordinate_id)
    for field in ("title", "description", "room_type", "size_band", "housing_type", "household", "style", "remix_note"):
        if field in payload.model_fields_set:
            value = getattr(payload, field)
            if value is not None or field in {"description", "remix_note"}:
                setattr(coordinate, field, value or "")
    if "budget_max" in payload.model_fields_set and payload.budget_max:
        coordinate.budget_max = payload.budget_max
        coordinate.budget_band = _budget_band(payload.budget_max)
    if "parent_coordinate_id" in payload.model_fields_set:
        parent, root_id = resolve_parent(session, session_id, payload.parent_coordinate_id, coordinate.id)
        if parent and not payload.derivation_type:
            raise HTTPException(status_code=422, detail="A derivative Coordinate requires a structured reason")
        coordinate.parent_coordinate_id = parent.id if parent else None
        coordinate.root_coordinate_id = root_id or coordinate.id
        coordinate.derivation_type = payload.derivation_type if parent else None
    elif "derivation_type" in payload.model_fields_set:
        if not coordinate.parent_coordinate_id:
            raise HTTPException(status_code=422, detail="A derivation reason requires a parent Coordinate")
        if payload.derivation_type is None:
            raise HTTPException(status_code=422, detail="A derivative Coordinate requires a structured reason")
        coordinate.derivation_type = payload.derivation_type
    session.commit()
    return load_coordinate(session, coordinate.id)


def unpublish_owned_coordinate(session: Session, session_id: str, coordinate_id: str) -> Coordinate:
    coordinate = require_owned_public_coordinate(session, session_id, coordinate_id)
    coordinate.visibility = "PRIVATE"
    coordinate.status = "ARCHIVED"
    coordinate.moderation_status = "HIDDEN"
    coordinate.unpublished_at = datetime.now(timezone.utc)
    withdraw_entries_for_coordinate(session, coordinate.id)
    session.commit()
    return coordinate


def require_owned_public_coordinate(session: Session, session_id: str, coordinate_id: str) -> Coordinate:
    coordinate = load_coordinate(session, coordinate_id)
    if coordinate.owner_session_id != session_id or not coordinate.creator_id:
        raise HTTPException(status_code=404, detail="Coordinate not found")
    if coordinate.visibility != "PUBLIC" or coordinate.moderation_status != "ACTIVE":
        raise HTTPException(status_code=404, detail="Coordinate not found")
    return coordinate


def add_helpful(session: Session, session_id: str, coordinate: Coordinate) -> int:
    _require_active_public(coordinate)
    if coordinate.owner_session_id == session_id:
        raise HTTPException(status_code=403, detail="You cannot mark your own Coordinate as helpful")
    existing = session.scalar(
        select(HelpfulReaction).where(
            HelpfulReaction.session_id == session_id,
            HelpfulReaction.coordinate_id == coordinate.id,
        )
    )
    if not existing:
        session.add(HelpfulReaction(session_id=session_id, coordinate_id=coordinate.id))
        session.commit()
    return helpful_count(session, coordinate.id)


def remove_helpful(session: Session, session_id: str, coordinate: Coordinate) -> int:
    _require_active_public(coordinate)
    session.execute(
        delete(HelpfulReaction).where(
            HelpfulReaction.session_id == session_id,
            HelpfulReaction.coordinate_id == coordinate.id,
        )
    )
    session.commit()
    return helpful_count(session, coordinate.id)


def helpful_count(session: Session, coordinate_id: str) -> int:
    return session.scalar(
        select(func.count()).select_from(HelpfulReaction).where(HelpfulReaction.coordinate_id == coordinate_id)
    ) or 0


def is_helpful(session: Session, session_id: str, coordinate_id: str) -> bool:
    return session.scalar(
        select(HelpfulReaction.id).where(
            HelpfulReaction.session_id == session_id,
            HelpfulReaction.coordinate_id == coordinate_id,
        )
    ) is not None


def report_content(session: Session, session_id: str, coordinate: Coordinate, reason: str) -> ContentReport:
    _require_active_public(coordinate)
    existing = session.scalar(
        select(ContentReport).where(
            ContentReport.session_id == session_id,
            ContentReport.coordinate_id == coordinate.id,
        )
    )
    if existing:
        existing.reason = reason
    else:
        existing = ContentReport(session_id=session_id, coordinate_id=coordinate.id, reason=reason, status="OPEN")
        session.add(existing)
    session.commit()
    return existing


def resolve_parent(
    session: Session,
    session_id: str,
    parent_id: str | None,
    child_id: str,
) -> tuple[Coordinate | None, str | None]:
    if not parent_id:
        return None, None
    if parent_id == child_id:
        raise HTTPException(status_code=422, detail="A Coordinate cannot be its own parent")
    parent = load_coordinate(session, parent_id)
    if not (
        parent.visibility == "PUBLIC" and parent.moderation_status == "ACTIVE"
    ) and parent.owner_session_id != session_id:
        raise HTTPException(status_code=404, detail="Parent Coordinate not found")
    cursor: Coordinate | None = parent
    seen: set[str] = set()
    while cursor:
        if cursor.id == child_id or cursor.id in seen:
            raise HTTPException(status_code=422, detail="Coordinate lineage cannot contain a cycle")
        seen.add(cursor.id)
        cursor = session.get(Coordinate, cursor.parent_coordinate_id) if cursor.parent_coordinate_id else None
    return parent, parent.root_coordinate_id or parent.id


def _products(session: Session, tags) -> dict[str, Product]:
    rows: dict[str, Product] = {}
    for tag in tags:
        if tag.product_id in rows:
            raise HTTPException(status_code=422, detail="Duplicate product tag")
        product = session.get(Product, tag.product_id)
        if not product:
            raise HTTPException(status_code=404, detail=f"Product not found: {tag.product_id}")
        rows[tag.product_id] = product
    return rows


def _owned_images(session: Session, session_id: str, image_ids: list[str]) -> list[CoordinateImage]:
    images: list[CoordinateImage] = []
    for image_id in image_ids:
        image = session.get(CoordinateImage, image_id)
        if not image or image.owner_session_id != session_id or image.coordinate_id is not None:
            raise HTTPException(status_code=404, detail="Uploaded image not found")
        images.append(image)
    return images


def _attach_images(images: list[CoordinateImage], coordinate: Coordinate) -> None:
    for index, image in enumerate(images):
        image.coordinate = coordinate
        image.sort_order = index


def _coordinate_items(payload: CreateCoordinateRequest, products: dict[str, Product]) -> list[CoordinateItem]:
    items: list[CoordinateItem] = []
    for tag in payload.products:
        product = products[tag.product_id]
        items.append(
            CoordinateItem(
                product_id=product.id,
                role=tag.role,
                source="CATALOG_TO_BUY",
                quantity=tag.quantity,
                price_snapshot=product.price_snapshot,
                price_observed_at=product.price_observed_at,
                mutation_state="ORIGINAL",
                position=len(items),
            )
        )
    for existing in payload.existing_furniture:
        items.append(
            CoordinateItem(
                role=existing.category,
                source="EXISTING_EXTERNAL",
                quantity=1,
                existing_label=existing.label,
                dimensions=existing.dimensions,
                mutation_state="ORIGINAL",
                position=len(items),
            )
        )
    return items


def _clone_item(item: CoordinateItem) -> CoordinateItem:
    return CoordinateItem(
        product_id=item.product_id,
        role=item.role,
        source=item.source,
        quantity=item.quantity,
        price_snapshot=item.price_snapshot,
        price_observed_at=item.price_observed_at,
        existing_label=item.existing_label,
        dimensions=item.dimensions,
        mutation_state=item.mutation_state,
        position=item.position,
    )


def _known_product_total(products: dict[str, Product]) -> int:
    return sum(product.price_snapshot or 0 for product in products.values())


def _fallback_image(products: dict[str, Product]) -> str:
    return next((product.image_url for product in products.values()), "/assets/room-natural.svg")


def _budget_band(value: int) -> str:
    if value <= 30_000:
        return "UNDER_30000"
    if value <= 50_000:
        return "UNDER_50000"
    if value <= 80_000:
        return "UNDER_80000"
    return "OVER_80000"


def _disclosure(kind: str) -> str:
    if kind == "REAL":
        return "User申告のREAL ROOMです。実在性・商品使用・購入をNITORIが確認したものではありません。"
    return "User申告の公開PLANです。購入済み・在庫確保・専門家による設計承認を意味しません。"


def _require_active_public(coordinate: Coordinate) -> None:
    if coordinate.visibility != "PUBLIC" or coordinate.moderation_status != "ACTIVE":
        raise HTTPException(status_code=404, detail="Coordinate not found")
