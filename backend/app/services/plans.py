from __future__ import annotations

from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import Coordinate, CoordinateItem, CoordinateNeed, Product


def load_coordinate(session: Session, coordinate_id: str) -> Coordinate:
    coordinate = session.execute(
        select(Coordinate)
        .options(
            joinedload(Coordinate.items).joinedload(CoordinateItem.product),
            joinedload(Coordinate.needs),
        )
        .where(Coordinate.id == coordinate_id)
    ).unique().scalar_one_or_none()
    if not coordinate:
        raise HTTPException(status_code=404, detail="Coordinate not found")
    return coordinate


def require_owned_plan(session: Session, plan_id: str, session_id: str) -> Coordinate:
    plan = load_coordinate(session, plan_id)
    if plan.kind != "PLAN" or plan.owner_session_id != session_id:
        raise HTTPException(status_code=404, detail="Private PLAN not found")
    return plan


def create_plan(session: Session, parent: Coordinate, session_id: str, budget_max: int | None = None) -> Coordinate:
    if parent.kind == "PLAN" and parent.owner_session_id == session_id:
        return parent
    plan = Coordinate(
        id=f"plan-{uuid4()}",
        owner_session_id=session_id,
        parent_coordinate_id=parent.id,
        kind="PLAN",
        status="DRAFT",
        visibility="PRIVATE",
        title=f"自分用：{parent.title}",
        description="デモ用のPrivate PLANです。専門家による設計・在庫確認・購入確定ではありません。",
        room_type=parent.room_type,
        size_band=parent.size_band,
        housing_type=parent.housing_type,
        household=parent.household,
        budget_band=parent.budget_band,
        budget_max=budget_max or parent.budget_max,
        style=parent.style,
        provenance="USER_DECLARED",
        verification_state="DEMO_UNVERIFIED",
        creator_display="あなた（デモ）",
        creator_type="LOCAL_DEMO_USER",
        image_url=parent.image_url,
        image_rights=parent.image_rights,
        demo_disclosure="このPLANと価格はローカルデモデータです。公開・購入・在庫確保はされません。",
        seasonal_collection=parent.seasonal_collection,
        editorial_rank=999,
        official_pick=False,
        ready_for_creator_impact=True,
    )
    plan.needs = [CoordinateNeed(need_code=need.need_code) for need in parent.needs]
    plan.items = [
        CoordinateItem(
            product_id=item.product_id,
            role=item.role,
            source=item.source,
            quantity=item.quantity,
            price_snapshot=item.price_snapshot,
            price_observed_at=item.price_observed_at,
            existing_label=item.existing_label,
            dimensions=item.dimensions,
            mutation_state="ORIGINAL",
            position=item.position,
        )
        for item in parent.items
    ]
    session.add(plan)
    session.commit()
    return load_coordinate(session, plan.id)


def mark_keep(session: Session, plan: Coordinate, item_id: int) -> Coordinate:
    item = _plan_item(plan, item_id)
    item.mutation_state = "KEPT"
    session.commit()
    return load_coordinate(session, plan.id)


def replace_item(session: Session, plan: Coordinate, item_id: int, product_id: str) -> Coordinate:
    item = _plan_item(plan, item_id)
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Replacement product not found")
    if item.product_id == product_id:
        raise HTTPException(status_code=409, detail="Select a different product")
    if item.role != product.default_role:
        raise HTTPException(status_code=422, detail="Replacement must use the same product role")
    item.product_id = product.id
    item.price_snapshot = product.price_snapshot
    item.price_observed_at = product.price_observed_at
    item.source = "CATALOG_TO_BUY"
    item.mutation_state = "REPLACED"
    session.commit()
    return load_coordinate(session, plan.id)


def add_product(session: Session, plan: Coordinate, product_id: str, role: str) -> Coordinate:
    product = session.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if role != product.default_role:
        raise HTTPException(status_code=422, detail="Role does not match product")
    if any(item.product_id == product_id for item in plan.items):
        raise HTTPException(status_code=409, detail="Product already exists in PLAN")
    plan.items.append(
        CoordinateItem(
            product_id=product.id,
            role=role,
            source="CATALOG_TO_BUY",
            quantity=1,
            price_snapshot=product.price_snapshot,
            price_observed_at=product.price_observed_at,
            mutation_state="ADDED",
            position=len(plan.items),
        )
    )
    session.commit()
    return load_coordinate(session, plan.id)


def add_existing(
    session: Session, plan: Coordinate, label: str, category: str, dimensions: str | None
) -> Coordinate:
    plan.items.append(
        CoordinateItem(
            product_id=None,
            role=category,
            source="EXISTING_EXTERNAL",
            quantity=1,
            price_snapshot=None,
            existing_label=label,
            dimensions=dimensions,
            mutation_state="ADDED",
            position=len(plan.items),
        )
    )
    session.commit()
    return load_coordinate(session, plan.id)


def mark_ready(session: Session, plan: Coordinate) -> Coordinate:
    if not any(item.product_id for item in plan.items):
        raise HTTPException(status_code=422, detail="PLAN requires at least one product")
    plan.status = "READY_FOR_ACTION"
    session.commit()
    return load_coordinate(session, plan.id)


def _plan_item(plan: Coordinate, item_id: int) -> CoordinateItem:
    item = next((candidate for candidate in plan.items if candidate.id == item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="PLAN item not found")
    return item
