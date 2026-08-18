from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import HTTPException

from app.models import Coordinate
from app.schemas.common import HandoffPayload, HandoffRequest


def build_handoff_preview(plan: Coordinate, request: HandoffRequest) -> HandoffPayload:
    product_ids = [item.product_id for item in plan.items if item.product_id and item.source == "CATALOG_TO_BUY"]
    if not product_ids:
        raise HTTPException(status_code=422, detail="No products available for handoff")
    anchor = request.anchor_product_id or product_ids[0]
    if anchor not in product_ids:
        raise HTTPException(status_code=422, detail="Anchor product must be selected in the PLAN")
    return HandoffPayload(
        handoff_id=f"preview-{uuid4()}",
        coordinate_id=plan.id,
        product_ids=product_ids,
        anchor_product_id=anchor,
        store_id=request.store_id,
        return_url=request.return_url,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
    )
