from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_session_id
from app.models import Coordinate, CoordinateItem, CoordinateSave
from app.schemas.common import CoordinateSummary, SaveResponse
from app.services.plans import load_coordinate
from app.services.serialization import coordinate_summary


router = APIRouter(prefix="/api/saved", tags=["saved"])


@router.get("", response_model=list[CoordinateSummary])
def saved_list(
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> list[CoordinateSummary]:
    rows = list(
        db.execute(
            select(Coordinate)
            .join(CoordinateSave)
            .where(CoordinateSave.session_id == session_id)
            .order_by(CoordinateSave.created_at.desc())
        )
        .unique()
        .scalars()
        .all()
    )
    return [coordinate_summary(load_coordinate(db, row.id), db, session_id) for row in rows]


@router.post("/{coordinate_id}", response_model=SaveResponse)
def save_coordinate(
    coordinate_id: str,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> SaveResponse:
    coordinate = load_coordinate(db, coordinate_id)
    if coordinate.visibility != "PUBLIC":
        return SaveResponse(coordinate_id=coordinate_id, saved=False)
    existing = db.scalar(
        select(CoordinateSave).where(
            CoordinateSave.session_id == session_id,
            CoordinateSave.coordinate_id == coordinate_id,
        )
    )
    if not existing:
        db.add(CoordinateSave(session_id=session_id, coordinate_id=coordinate_id))
        db.commit()
    return SaveResponse(coordinate_id=coordinate_id, saved=True)


@router.delete("/{coordinate_id}", response_model=SaveResponse)
def remove_saved(
    coordinate_id: str,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> SaveResponse:
    db.execute(
        delete(CoordinateSave).where(
            CoordinateSave.session_id == session_id,
            CoordinateSave.coordinate_id == coordinate_id,
        )
    )
    db.commit()
    return SaveResponse(coordinate_id=coordinate_id, saved=False)
