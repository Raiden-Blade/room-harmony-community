from __future__ import annotations

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_session_id
from app.models import Challenge, ChallengeEntry
from app.schemas.seasonal import (
    ChallengeCandidate,
    ChallengeDetail,
    ChallengeEntryRequest,
    ChallengeEntryResponse,
    ChallengeListResponse,
    ChallengeSummary,
    SeasonalLandingResponse,
)
from app.services.plans import load_coordinate
from app.services.seasonal import (
    entry_counts,
    list_challenges,
    load_challenge,
    owned_candidates,
    submit_entry,
    visible_entries,
)
from app.services.seasonal_rules import constraints_for, eligibility_for
from app.services.serialization import coordinate_summary


router = APIRouter(prefix="/api", tags=["seasonal"])


@router.get("/seasonal", response_model=SeasonalLandingResponse)
def seasonal_landing(
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> SeasonalLandingResponse:
    active = list_challenges(db, status="ACTIVE")
    upcoming = list_challenges(db, status="UPCOMING")
    ended = list_challenges(db, status="ENDED")
    archived = list_challenges(db, status="ARCHIVED")
    featured = next((item for item in active if item.challenge_type == "LIFE_EVENT"), active[0] if active else None)
    previous_year_coordinates = []
    archive_source = next(
        (
            item
            for item in archived
            if featured and item.theme == featured.theme and item.year < featured.year
        ),
        archived[0] if archived else None,
    )
    if archive_source:
        previous_year_coordinates = [
            coordinate_summary(load_coordinate(db, entry.coordinate_id), db, session_id)
            for entry in visible_entries(db, archive_source.id)[:6]
        ]
    return SeasonalLandingResponse(
        featured=_summary(featured, db) if featured else None,
        active=[_summary(item, db) for item in active],
        upcoming=[_summary(item, db) for item in upcoming],
        ended=[_summary(item, db) for item in ended],
        archived=[_summary(item, db) for item in archived],
        constraint_themes=[_summary(item, db) for item in active + upcoming if item.challenge_type == "CONSTRAINT"],
        previous_year_coordinates=previous_year_coordinates,
    )


@router.get("/challenges", response_model=ChallengeListResponse)
def challenge_list(
    db: Annotated[Session, Depends(get_db)],
    challenge_status: Annotated[
        Literal["UPCOMING", "ACTIVE", "ENDED", "ARCHIVED"] | None,
        Query(alias="status"),
    ] = None,
    season: Literal["SPRING", "SUMMER", "AUTUMN", "WINTER"] | None = None,
    challenge_type: Literal["LIFE_EVENT", "CONSTRAINT", "ADAPT_REMIX"] | None = None,
) -> ChallengeListResponse:
    return ChallengeListResponse(
        results=[
            _summary(item, db)
            for item in list_challenges(
                db,
                status=challenge_status,
                season=season,
                challenge_type=challenge_type,
            )
        ]
    )


@router.get("/challenges/{challenge_slug}", response_model=ChallengeDetail)
def challenge_detail(
    challenge_slug: str,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> ChallengeDetail:
    challenge = load_challenge(db, challenge_slug)
    entries = [_entry_response(item, db, session_id) for item in visible_entries(db, challenge.id)]
    counts = entry_counts(db, challenge.id)
    candidates = [
        ChallengeCandidate(
            coordinate=coordinate_summary(coordinate, db, session_id),
            eligible=result.eligible,
            rejection_codes=list(result.codes),
            rejection_messages=list(result.messages),
            already_entered=already_entered,
        )
        for coordinate, result, already_entered in owned_candidates(db, session_id, challenge)
    ]
    return ChallengeDetail(
        **_summary(challenge, db).model_dump(),
        why_it_matters=challenge.why_it_matters,
        eligibility=eligibility_for(challenge),
        participation_count=counts["total"],
        real_count=counts["REAL"],
        plan_count=counts["PLAN"],
        entries=entries,
        prototype_picks=[entry for entry in entries if entry.recognition is not None],
        my_candidates=candidates,
    )


@router.post(
    "/challenges/{challenge_slug}/entries",
    response_model=ChallengeEntryResponse,
    status_code=status.HTTP_201_CREATED,
)
def enter_challenge(
    challenge_slug: str,
    payload: ChallengeEntryRequest,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> ChallengeEntryResponse:
    challenge = load_challenge(db, challenge_slug)
    entry = submit_entry(db, session_id, challenge, payload.coordinate_id)
    return _entry_response(entry, db, session_id)


def _summary(challenge: Challenge, session: Session) -> ChallengeSummary:
    constraints = constraints_for(challenge)
    counts = entry_counts(session, challenge.id)
    return ChallengeSummary(
        id=challenge.id,
        slug=challenge.slug,
        title=challenge.title,
        description=challenge.description,
        theme=challenge.theme,
        season=challenge.season,
        year=challenge.year,
        challenge_type=challenge.challenge_type,
        status=challenge.status,
        start_at=challenge.start_at,
        end_at=challenge.end_at,
        archive_at=challenge.archive_at,
        cover_asset=challenge.cover_asset,
        provenance=challenge.provenance,
        constraints=constraints,
        constraint_summary="・".join(item.label for item in constraints[:4]),
        entry_count=counts["total"],
    )


def _entry_response(entry: ChallengeEntry, session: Session, session_id: str) -> ChallengeEntryResponse:
    coordinate = load_coordinate(session, entry.coordinate_id)
    return ChallengeEntryResponse(
        id=entry.id,
        challenge_id=entry.challenge_id,
        coordinate_id=entry.coordinate_id,
        creator_id=entry.creator_id,
        submitted_at=entry.submitted_at,
        status=entry.status,
        recognition=entry.recognition,
        provenance="PROTOTYPE_PICK" if entry.recognition else entry.provenance,
        coordinate=coordinate_summary(coordinate, session, session_id),
    )
