from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import Challenge, ChallengeEntry, Coordinate
from app.schemas.common import CoordinateChallengeContext, CoordinateChallengeOption
from app.schemas.seasonal import (
    CreatorChallengeParticipation,
    CreatorSeasonalSummary,
)
from app.services.plans import load_coordinate
from app.services.seasonal_rules import EligibilityResult, evaluate_eligibility


def load_challenge(session: Session, slug_or_id: str) -> Challenge:
    challenge = session.scalar(
        select(Challenge).where((Challenge.slug == slug_or_id) | (Challenge.id == slug_or_id))
    )
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return challenge


def list_challenges(
    session: Session,
    *,
    status: str | None = None,
    season: str | None = None,
    challenge_type: str | None = None,
) -> list[Challenge]:
    statement = select(Challenge)
    if status:
        statement = statement.where(Challenge.status == status)
    if season:
        statement = statement.where(Challenge.season == season)
    if challenge_type:
        statement = statement.where(Challenge.challenge_type == challenge_type)
    statement = statement.order_by(Challenge.year.desc(), Challenge.start_at, Challenge.id)
    return list(session.scalars(statement).all())


def visible_entries(session: Session, challenge_id: str) -> list[ChallengeEntry]:
    return list(
        session.scalars(
            select(ChallengeEntry)
            .join(Coordinate, Coordinate.id == ChallengeEntry.coordinate_id)
            .where(
                ChallengeEntry.challenge_id == challenge_id,
                ChallengeEntry.status == "ACTIVE",
                Coordinate.visibility == "PUBLIC",
                Coordinate.moderation_status == "ACTIVE",
                Coordinate.unpublished_at.is_(None),
            )
            .order_by(ChallengeEntry.submitted_at.desc(), ChallengeEntry.id)
        ).all()
    )


def entry_counts(session: Session, challenge_id: str) -> dict[str, int]:
    rows = session.execute(
        select(Coordinate.kind, func.count(ChallengeEntry.id))
        .join(ChallengeEntry, ChallengeEntry.coordinate_id == Coordinate.id)
        .where(
            ChallengeEntry.challenge_id == challenge_id,
            ChallengeEntry.status == "ACTIVE",
            Coordinate.visibility == "PUBLIC",
            Coordinate.moderation_status == "ACTIVE",
            Coordinate.unpublished_at.is_(None),
        )
        .group_by(Coordinate.kind)
    ).all()
    counts = {kind: count for kind, count in rows}
    return {"total": sum(counts.values()), "REAL": counts.get("REAL", 0), "PLAN": counts.get("PLAN", 0)}


def owned_candidates(
    session: Session, session_id: str, challenge: Challenge
) -> list[tuple[Coordinate, EligibilityResult, bool]]:
    coordinates = list(
        session.scalars(
            select(Coordinate)
            .where(
                Coordinate.owner_session_id == session_id,
                Coordinate.creator_id.is_not(None),
                Coordinate.visibility == "PUBLIC",
                Coordinate.moderation_status == "ACTIVE",
                Coordinate.unpublished_at.is_(None),
            )
            .order_by(Coordinate.published_at.desc(), Coordinate.created_at.desc())
        ).all()
    )
    candidates: list[tuple[Coordinate, EligibilityResult, bool]] = []
    for coordinate_row in coordinates:
        coordinate = load_coordinate(session, coordinate_row.id)
        existing = session.scalar(
            select(ChallengeEntry.id).where(
                ChallengeEntry.challenge_id == challenge.id,
                ChallengeEntry.coordinate_id == coordinate.id,
            )
        )
        candidates.append((coordinate, evaluate_eligibility(challenge, coordinate), existing is not None))
    return candidates


def submit_entry(
    session: Session,
    session_id: str,
    challenge: Challenge,
    coordinate_id: str,
) -> ChallengeEntry:
    if challenge.status != "ACTIVE":
        raise HTTPException(status_code=409, detail="Challenge is not active")
    coordinate = load_coordinate(session, coordinate_id)
    if (
        coordinate.owner_session_id != session_id
        or not coordinate.creator_id
        or coordinate.visibility != "PUBLIC"
        or coordinate.moderation_status != "ACTIVE"
        or coordinate.unpublished_at is not None
    ):
        raise HTTPException(status_code=404, detail="Owned public Coordinate not found")
    existing = session.scalar(
        select(ChallengeEntry).where(
            ChallengeEntry.challenge_id == challenge.id,
            ChallengeEntry.coordinate_id == coordinate.id,
        )
    )
    if existing:
        raise HTTPException(status_code=409, detail="Coordinate is already entered in this Challenge")
    eligibility = evaluate_eligibility(challenge, coordinate)
    if not eligibility.eligible:
        raise HTTPException(
            status_code=422,
            detail={"code": "CHALLENGE_NOT_ELIGIBLE", "reasons": list(eligibility.codes)},
        )
    entry = ChallengeEntry(
        id=f"entry-{uuid4()}",
        challenge_id=challenge.id,
        coordinate_id=coordinate.id,
        creator_id=coordinate.creator_id,
        status="ACTIVE",
        recognition=None,
        provenance="USER",
    )
    session.add(entry)
    try:
        session.commit()
    except IntegrityError as error:
        session.rollback()
        raise HTTPException(status_code=409, detail="Coordinate is already entered in this Challenge") from error
    session.refresh(entry)
    return entry


def withdraw_entries_for_coordinate(session: Session, coordinate_id: str) -> None:
    rows = list(
        session.scalars(
            select(ChallengeEntry).where(
                ChallengeEntry.coordinate_id == coordinate_id,
                ChallengeEntry.status == "ACTIVE",
            )
        ).all()
    )
    now = datetime.now(timezone.utc)
    for entry in rows:
        entry.status = "WITHDRAWN"
        entry.withdrawn_at = now


def coordinate_challenge_contexts(session: Session, coordinate_id: str) -> list[CoordinateChallengeContext]:
    rows = session.execute(
        select(ChallengeEntry, Challenge)
        .join(Challenge, Challenge.id == ChallengeEntry.challenge_id)
        .where(ChallengeEntry.coordinate_id == coordinate_id, ChallengeEntry.status == "ACTIVE")
        .order_by(Challenge.year.desc(), Challenge.start_at)
    ).all()
    return [
        CoordinateChallengeContext(
            challenge_id=challenge.id,
            challenge_slug=challenge.slug,
            challenge_title=challenge.title,
            season=challenge.season,
            year=challenge.year,
            status=challenge.status,
            entry_status=entry.status,
            recognition=entry.recognition,
            provenance="PROTOTYPE_PICK" if entry.recognition else entry.provenance,
        )
        for entry, challenge in rows
    ]


def coordinate_challenge_options(
    session: Session,
    session_id: str,
    coordinate: Coordinate,
) -> list[CoordinateChallengeOption]:
    if coordinate.owner_session_id != session_id or not coordinate.creator_id:
        return []
    options: list[CoordinateChallengeOption] = []
    for challenge in list_challenges(session, status="ACTIVE"):
        existing = session.scalar(
            select(ChallengeEntry.id).where(
                ChallengeEntry.challenge_id == challenge.id,
                ChallengeEntry.coordinate_id == coordinate.id,
            )
        )
        result = evaluate_eligibility(challenge, coordinate)
        options.append(
            CoordinateChallengeOption(
                challenge_id=challenge.id,
                challenge_slug=challenge.slug,
                challenge_title=challenge.title,
                challenge_type=challenge.challenge_type,
                season=challenge.season,
                year=challenge.year,
                eligible=result.eligible,
                rejection_codes=list(result.codes),
                rejection_messages=list(result.messages),
                already_entered=existing is not None,
            )
        )
    return options


def creator_seasonal_summary(session: Session, creator_id: str) -> CreatorSeasonalSummary:
    rows = session.execute(
        select(ChallengeEntry, Challenge, Coordinate)
        .join(Challenge, Challenge.id == ChallengeEntry.challenge_id)
        .join(Coordinate, Coordinate.id == ChallengeEntry.coordinate_id)
        .where(
            ChallengeEntry.creator_id == creator_id,
            ChallengeEntry.status == "ACTIVE",
            Coordinate.visibility == "PUBLIC",
            Coordinate.moderation_status == "ACTIVE",
            Coordinate.unpublished_at.is_(None),
        )
        .order_by(Challenge.year.desc(), Challenge.start_at)
    ).all()
    coordinate_ids = [coordinate.id for _, _, coordinate in rows]
    seasonal_reuse = 0
    if coordinate_ids:
        seasonal_reuse = session.scalar(
            select(func.count())
            .select_from(Coordinate)
            .where(Coordinate.parent_coordinate_id.in_(coordinate_ids))
        ) or 0
    participations = [
        CreatorChallengeParticipation(
            challenge_id=challenge.id,
            challenge_slug=challenge.slug,
            challenge_title=challenge.title,
            season=challenge.season,
            year=challenge.year,
            coordinate_id=coordinate.id,
            coordinate_title=coordinate.title,
            recognition=entry.recognition,
            provenance="PROTOTYPE_PICK" if entry.recognition else entry.provenance,
        )
        for entry, challenge, coordinate in rows
    ]
    return CreatorSeasonalSummary(
        challenge_entries=len(rows),
        recognized_coordinates=sum(entry.recognition is not None for entry, _, _ in rows),
        seasonal_reuse_count=seasonal_reuse,
        participations=participations,
    )
