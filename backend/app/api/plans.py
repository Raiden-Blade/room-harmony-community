from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_session_id
from app.integrations.room_harmony import build_handoff_preview
from app.models import Coordinate
from app.schemas.common import (
    AddItemRequest,
    CoordinateDetail,
    CreatePlanRequest,
    ExistingFurnitureRequest,
    HandoffPayload,
    HandoffRequest,
    PlanVisualLayoutRequest,
    PlanVisualLayoutResponse,
    ReplaceItemRequest,
)
from app.schemas.community import PublishPlanRequest
from app.services.community import publish_plan
from app.services.plans import (
    add_existing,
    add_product,
    create_plan,
    load_coordinate,
    mark_keep,
    mark_ready,
    replace_item,
    require_owned_plan,
)
from app.services.serialization import coordinate_detail
from app.services.visual_layouts import layout_for_plan, save_layout


router = APIRouter(prefix="/api/plans", tags=["plans"])


@router.get("", response_model=list[CoordinateDetail])
def plans(
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> list[CoordinateDetail]:
    rows = list(
        db.scalars(
            select(Coordinate)
            .where(
                Coordinate.kind == "PLAN",
                Coordinate.visibility == "PRIVATE",
                Coordinate.owner_session_id == session_id,
            )
            .order_by(Coordinate.updated_at.desc())
        ).all()
    )
    return [coordinate_detail(load_coordinate(db, row.id), db, session_id) for row in rows]


@router.post("/from-coordinate/{coordinate_id}", response_model=CoordinateDetail, status_code=201)
def plan_from_coordinate(
    coordinate_id: str,
    payload: CreatePlanRequest,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> CoordinateDetail:
    parent = load_coordinate(db, coordinate_id)
    if parent.visibility != "PUBLIC" and parent.owner_session_id != session_id:
        raise HTTPException(status_code=404, detail="Coordinate not found")
    plan = create_plan(db, parent, session_id, payload.budget_max)
    return coordinate_detail(plan, db, session_id)


@router.get("/{plan_id}", response_model=CoordinateDetail)
def plan_by_id(
    plan_id: str,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> CoordinateDetail:
    return coordinate_detail(require_owned_plan(db, plan_id, session_id), db, session_id)


@router.get("/{plan_id}/visual-layout", response_model=PlanVisualLayoutResponse)
def get_visual_layout(
    plan_id: str,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> PlanVisualLayoutResponse:
    return layout_for_plan(db, require_owned_plan(db, plan_id, session_id))


@router.put("/{plan_id}/visual-layout", response_model=PlanVisualLayoutResponse)
def put_visual_layout(
    plan_id: str,
    payload: PlanVisualLayoutRequest,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> PlanVisualLayoutResponse:
    return save_layout(db, require_owned_plan(db, plan_id, session_id), session_id, payload)


@router.post("/{plan_id}/items/{item_id}/keep", response_model=CoordinateDetail)
def keep_item(
    plan_id: str,
    item_id: int,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> CoordinateDetail:
    plan = mark_keep(db, require_owned_plan(db, plan_id, session_id), item_id)
    return coordinate_detail(plan, db, session_id)


@router.post("/{plan_id}/items/{item_id}/replace", response_model=CoordinateDetail)
def replace_plan_item(
    plan_id: str,
    item_id: int,
    payload: ReplaceItemRequest,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> CoordinateDetail:
    plan = replace_item(db, require_owned_plan(db, plan_id, session_id), item_id, payload.product_id)
    return coordinate_detail(plan, db, session_id)


@router.post("/{plan_id}/items", response_model=CoordinateDetail)
def add_plan_item(
    plan_id: str,
    payload: AddItemRequest,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> CoordinateDetail:
    plan = add_product(db, require_owned_plan(db, plan_id, session_id), payload.product_id, payload.role)
    return coordinate_detail(plan, db, session_id)


@router.post("/{plan_id}/existing-furniture", response_model=CoordinateDetail)
def existing_furniture(
    plan_id: str,
    payload: ExistingFurnitureRequest,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> CoordinateDetail:
    plan = add_existing(
        db,
        require_owned_plan(db, plan_id, session_id),
        payload.label,
        payload.category,
        payload.dimensions,
    )
    return coordinate_detail(plan, db, session_id)


@router.post("/{plan_id}/ready", response_model=CoordinateDetail)
def ready_plan(
    plan_id: str,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> CoordinateDetail:
    plan = mark_ready(db, require_owned_plan(db, plan_id, session_id))
    return coordinate_detail(plan, db, session_id)


@router.post("/{plan_id}/publish", response_model=CoordinateDetail, status_code=201)
def publish_private_plan(
    plan_id: str,
    payload: PublishPlanRequest,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> CoordinateDetail:
    coordinate = publish_plan(db, session_id, plan_id, payload)
    return coordinate_detail(coordinate, db, session_id)


@router.post("/{plan_id}/handoff-preview", response_model=HandoffPayload)
def handoff_preview(
    plan_id: str,
    payload: HandoffRequest,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> HandoffPayload:
    return build_handoff_preview(require_owned_plan(db, plan_id, session_id), payload)
