from __future__ import annotations

import json
from collections import Counter
from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_session_id
from app.models import AnalyticsEvent
from app.schemas.common import AnalyticsEventRequest, AnalyticsEventResponse, KpiReadinessResponse


router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.post("/events", response_model=AnalyticsEventResponse, status_code=202)
def record_event(
    payload: AnalyticsEventRequest,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> AnalyticsEventResponse:
    event = AnalyticsEvent(
        event_name=payload.event_name,
        occurred_at=payload.occurred_at or datetime.now(timezone.utc),
        session_id=session_id,
        coordinate_id=payload.coordinate_id,
        product_id=payload.product_id,
        comparison_condition=payload.comparison_condition,
        properties_json=json.dumps(payload.properties, ensure_ascii=False, sort_keys=True),
    )
    db.add(event)
    db.commit()
    return AnalyticsEventResponse(event_name=payload.event_name)


@router.get("/readiness", response_model=KpiReadinessResponse)
def readiness(db: Annotated[Session, Depends(get_db)]) -> KpiReadinessResponse:
    events = list(db.scalars(select(AnalyticsEvent)).all())
    counts = Counter(event.event_name for event in events)
    similar_exposures = sum(
        event.event_name == "discovery_impression" and event.comparison_condition == "similar" for event in events
    )
    popular_exposures = sum(
        event.event_name == "discovery_impression" and event.comparison_condition == "popular" for event in events
    )
    return KpiReadinessResponse(
        disclaimer=(
            "デモ操作ログの計測準備状況です。Similar / PopularはUserが選んだ表示条件であり、"
            "Randomized A/B assignment、効果改善、売上向上を示しません。"
        ),
        event_counts=dict(sorted(counts.items())),
        measurement_support={
            "H1": {
                "instrumented": similar_exposures > 0 and popular_exposures > 0,
                "similar_selected_exposures": similar_exposures,
                "popular_selected_exposures": popular_exposures,
                "product_views": counts["product_view"],
            },
            "H2": {
                "instrumented": counts["coordinate_view"] > 0,
                "coordinate_views": counts["coordinate_view"],
                "product_views": counts["product_view"],
            },
            "H3": {
                "instrumented": counts["coordinate_save"] > 0,
                "saves": counts["coordinate_save"],
                "plan_starts": counts["plan_start"],
                "actions": counts["ec_action"] + counts["room_harmony_handoff_preview"],
            },
        },
    )
