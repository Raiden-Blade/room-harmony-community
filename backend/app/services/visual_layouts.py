from __future__ import annotations

import hashlib
import json

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Coordinate, PlanVisualLayout
from app.schemas.common import PlanVisualLayoutItem, PlanVisualLayoutRequest, PlanVisualLayoutResponse


def layout_for_plan(session: Session, plan: Coordinate) -> PlanVisualLayoutResponse:
    stored = session.get(PlanVisualLayout, plan.id)
    if not stored:
        return PlanVisualLayoutResponse(plan_id=plan.id, version=0, status="NOT_SAVED")
    if stored.product_fingerprint != _fingerprint(plan):
        return PlanVisualLayoutResponse(
            plan_id=plan.id,
            version=stored.version,
            status="RESET_DUE_TO_PLAN_CHANGE",
            updated_at=stored.updated_at,
        )
    try:
        items = [PlanVisualLayoutItem.model_validate(item) for item in json.loads(stored.layout_json)]
    except (TypeError, ValueError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=500, detail="Saved PLAN layout is invalid") from exc
    return PlanVisualLayoutResponse(
        plan_id=plan.id,
        version=stored.version,
        status="SAVED",
        updated_at=stored.updated_at,
        layout_items=items,
    )


def save_layout(
    session: Session,
    plan: Coordinate,
    session_id: str,
    payload: PlanVisualLayoutRequest,
) -> PlanVisualLayoutResponse:
    product_items = {item.id: item for item in plan.items if item.product_id and item.product}
    requested_ids = [item.item_id for item in payload.layout_items]
    if len(requested_ids) != len(set(requested_ids)):
        raise HTTPException(status_code=422, detail="Layout contains duplicate PLAN items")
    if set(requested_ids) != set(product_items):
        raise HTTPException(status_code=409, detail="PLAN products changed; reload the layout")
    for item in payload.layout_items:
        current = product_items.get(item.item_id)
        if not current or current.product_id != item.product_id:
            raise HTTPException(status_code=409, detail="PLAN products changed; reload the layout")

    stored = session.get(PlanVisualLayout, plan.id)
    current_version = stored.version if stored else 0
    if payload.base_version != current_version:
        raise HTTPException(status_code=409, detail="PLAN layout was updated; reload before saving")
    if not stored:
        stored = PlanVisualLayout(
            plan_id=plan.id,
            owner_session_id=session_id,
            product_fingerprint=_fingerprint(plan),
            version=1,
        )
        session.add(stored)
    else:
        stored.version += 1
        stored.product_fingerprint = _fingerprint(plan)
    stored.layout_json = json.dumps(
        [item.model_dump() for item in payload.layout_items],
        ensure_ascii=False,
        separators=(",", ":"),
    )
    session.commit()
    session.refresh(stored)
    return PlanVisualLayoutResponse(
        plan_id=plan.id,
        version=stored.version,
        status="SAVED",
        updated_at=stored.updated_at,
        layout_items=payload.layout_items,
    )


def _fingerprint(plan: Coordinate) -> str:
    values = sorted(f"{item.id}:{item.product_id}" for item in plan.items if item.product_id)
    return hashlib.sha256("|".join(values).encode("utf-8")).hexdigest()
