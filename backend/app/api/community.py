from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Request, Response, UploadFile, status
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_session_id
from app.schemas.common import CoordinateDetail
from app.schemas.community import (
    CoordinateUpdateRequest,
    CreateCoordinateRequest,
    CreatorProfileResponse,
    CreatorUpsertRequest,
    HelpfulResponse,
    ImageUploadResponse,
    ReportRequest,
    ReportResponse,
)
from app.services.community import (
    add_helpful,
    create_public_coordinate,
    creator_coordinates,
    creator_for_session,
    impact_for_coordinates,
    load_creator,
    remove_helpful,
    report_content,
    require_owned_public_coordinate,
    unpublish_owned_coordinate,
    update_owned_coordinate,
    upsert_creator,
)
from app.services.images import delete_coordinate_files, image_url, normalize_upload
from app.services.plans import load_coordinate
from app.services.serialization import coordinate_detail, coordinate_summary


router = APIRouter(prefix="/api", tags=["community"])


@router.put("/creators/me", response_model=CreatorProfileResponse)
def save_creator_identity(
    payload: CreatorUpsertRequest,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> CreatorProfileResponse:
    creator = upsert_creator(db, session_id, payload)
    return _creator_response(db, creator.id, session_id)


@router.get("/creators/me", response_model=CreatorProfileResponse)
def my_creator_profile(
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> CreatorProfileResponse:
    creator = creator_for_session(db, session_id)
    if not creator:
        raise HTTPException(status_code=404, detail="Creator profile not found")
    return _creator_response(db, creator.id, session_id)


@router.get("/creators/{creator_id}", response_model=CreatorProfileResponse)
def public_creator_profile(
    creator_id: str,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> CreatorProfileResponse:
    load_creator(db, creator_id)
    return _creator_response(db, creator_id, session_id)


@router.post("/community/images", response_model=ImageUploadResponse, status_code=status.HTTP_201_CREATED)
async def upload_coordinate_image(
    request: Request,
    image: Annotated[UploadFile, File(...)],
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> ImageUploadResponse:
    record = await normalize_upload(
        db,
        image,
        session_id,
        request.app.state.settings.upload_dir,
        request.app.state.settings.max_upload_bytes,
    )
    return ImageUploadResponse(
        id=record.id,
        url=image_url(record),
        width=record.width,
        height=record.height,
        size_bytes=record.size_bytes,
    )


@router.post(
    "/community/coordinates",
    response_model=CoordinateDetail,
    status_code=status.HTTP_201_CREATED,
)
def publish_coordinate(
    payload: CreateCoordinateRequest,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> CoordinateDetail:
    coordinate = create_public_coordinate(db, session_id, payload)
    return coordinate_detail(coordinate, db, session_id)


@router.patch("/community/coordinates/{coordinate_id}", response_model=CoordinateDetail)
def edit_coordinate(
    coordinate_id: str,
    payload: CoordinateUpdateRequest,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> CoordinateDetail:
    coordinate = update_owned_coordinate(db, session_id, coordinate_id, payload)
    return coordinate_detail(coordinate, db, session_id)


@router.delete("/community/coordinates/{coordinate_id}", status_code=status.HTTP_204_NO_CONTENT)
def unpublish_coordinate(
    coordinate_id: str,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> Response:
    coordinate = unpublish_owned_coordinate(db, session_id, coordinate_id)
    delete_coordinate_files(coordinate.images, request.app.state.settings.upload_dir)
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/community/coordinates/{coordinate_id}/helpful", response_model=HelpfulResponse)
def mark_helpful(
    coordinate_id: str,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> HelpfulResponse:
    coordinate = load_coordinate(db, coordinate_id)
    count = add_helpful(db, session_id, coordinate)
    return HelpfulResponse(coordinate_id=coordinate_id, helpful=True, helpful_count=count)


@router.delete("/community/coordinates/{coordinate_id}/helpful", response_model=HelpfulResponse)
def clear_helpful(
    coordinate_id: str,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> HelpfulResponse:
    coordinate = load_coordinate(db, coordinate_id)
    count = remove_helpful(db, session_id, coordinate)
    return HelpfulResponse(coordinate_id=coordinate_id, helpful=False, helpful_count=count)


@router.post(
    "/community/coordinates/{coordinate_id}/reports",
    response_model=ReportResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
def report_coordinate(
    coordinate_id: str,
    payload: ReportRequest,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> ReportResponse:
    coordinate = load_coordinate(db, coordinate_id)
    report = report_content(db, session_id, coordinate, payload.reason)
    return ReportResponse(coordinate_id=coordinate_id, reason=report.reason)


def _creator_response(session: Session, creator_id: str, session_id: str) -> CreatorProfileResponse:
    creator = load_creator(session, creator_id)
    rows = creator_coordinates(session, creator_id)
    coordinate_ids = [item.id for item in rows]
    return CreatorProfileResponse(
        id=creator.id,
        display_name=creator.display_name,
        bio=creator.bio,
        contribution_count=len(rows),
        impact=impact_for_coordinates(session, coordinate_ids),
        created_at=creator.created_at,
        contributions=[coordinate_summary(load_coordinate(session, row.id), session, session_id) for row in rows],
        is_owner=creator.owner_session_id == session_id,
    )
