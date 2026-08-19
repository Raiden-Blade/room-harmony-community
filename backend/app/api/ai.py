from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from app.ai.provider import AIProviderError
from app.ai.schemas import (
    AIApplyRequest,
    AIApplyResult,
    AISuggestionRequest,
    AISuggestionResponse,
    AIStatus,
    FitAssessment,
    PreferenceProfile,
    PreferenceProfileInput,
)
from app.ai.service import apply_suggestion, fit_for_plan, generate_suggestions, get_profile, save_profile
from app.api.deps import get_db, get_session_id
from app.schemas.common import CoordinateDetail
from app.services.plans import require_owned_plan
from app.services.serialization import coordinate_detail


router = APIRouter(prefix="/api", tags=["ai-plan-assist"])


class ApplyResponse(AIApplyResult):
    plan: CoordinateDetail


def _raise_safe(exc: AIProviderError):
    raise HTTPException(status_code=exc.status_code, detail={"code": exc.code, "message": exc.safe_message}) from exc


@router.get("/ai/status", response_model=AIStatus)
def ai_status(request: Request) -> AIStatus:
    return request.app.state.ai_provider.status()


@router.get("/ai/profile", response_model=PreferenceProfile)
def ai_profile(
    plan_id: Annotated[str, Query(min_length=1, max_length=64)],
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> PreferenceProfile:
    return get_profile(db, session_id, require_owned_plan(db, plan_id, session_id))


@router.put("/ai/profile", response_model=PreferenceProfile)
def update_ai_profile(
    payload: PreferenceProfileInput,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> PreferenceProfile:
    return save_profile(db, session_id, payload)


@router.get("/plans/{plan_id}/fit", response_model=FitAssessment)
def plan_fit(
    plan_id: str,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> FitAssessment:
    return fit_for_plan(db, session_id, require_owned_plan(db, plan_id, session_id))


@router.post("/plans/{plan_id}/ai/suggestions", response_model=AISuggestionResponse)
def plan_ai_suggestions(
    plan_id: str,
    payload: AISuggestionRequest,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> AISuggestionResponse:
    try:
        return generate_suggestions(
            db,
            session_id,
            require_owned_plan(db, plan_id, session_id),
            request.app.state.ai_provider,
            request.app.state.ai_rate_limiter,
            payload.profile,
        )
    except AIProviderError as exc:
        _raise_safe(exc)


@router.post("/plans/{plan_id}/ai/apply", response_model=ApplyResponse)
def plan_ai_apply(
    plan_id: str,
    payload: AIApplyRequest,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> ApplyResponse:
    try:
        updated, suggestion, before, after = apply_suggestion(
            db, session_id, require_owned_plan(db, plan_id, session_id), payload.suggestion_id
        )
        return ApplyResponse(
            plan=coordinate_detail(updated, db, session_id),
            suggestion=suggestion,
            before_fit=before,
            after_fit=after,
        )
    except AIProviderError as exc:
        _raise_safe(exc)
