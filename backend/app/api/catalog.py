from __future__ import annotations

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_session_id
from app.ranking import DiscoveryContext, rank_coordinates
from app.repositories.catalog import coordinates_for_product, get_product, list_products, list_public_coordinates
from app.schemas.common import (
    CoordinateDetail,
    DiscoveryResponse,
    OptionsResponse,
    ProductDetail,
    ProductListResponse,
    ProductSummary,
)
from app.services.plans import load_coordinate
from app.services.serialization import coordinate_detail, coordinate_summary


router = APIRouter(prefix="/api", tags=["discovery"])


ROOM_SIZES = [
    {"value": "TINY_5_5", "label": "5.5畳前後"},
    {"value": "SMALL_6", "label": "6畳前後"},
    {"value": "MEDIUM_7_8", "label": "7〜8畳"},
]
NEEDS = [
    {"value": "STORAGE", "label": "収納を増やしたい"},
    {"value": "LOW_BUDGET", "label": "低予算で揃えたい"},
    {"value": "WORK_FROM_HOME", "label": "勉強・在宅作業"},
    {"value": "RELAX", "label": "くつろぎたい"},
    {"value": "SLEEP", "label": "睡眠環境を整えたい"},
    {"value": "COMPACT", "label": "部屋を広く使いたい"},
]
BUDGETS = [
    {"value": 30_000, "label": "3万円以内"},
    {"value": 50_000, "label": "5万円以内"},
    {"value": 80_000, "label": "8万円以内"},
    {"value": 120_000, "label": "12万円以内"},
]
STYLES = [
    {"value": "NATURAL", "label": "ナチュラル"},
    {"value": "CLEAR_COOL", "label": "クリアクール"},
    {"value": "DANDY", "label": "ダンディ"},
    {"value": "ELEGANT", "label": "エレガント"},
    {"value": "COZY", "label": "コージー"},
    {"value": "COLORFUL", "label": "カラフル"},
]


@router.get("/meta/options", response_model=OptionsResponse)
def options() -> OptionsResponse:
    return OptionsResponse(room_sizes=ROOM_SIZES, needs=NEEDS, budgets=BUDGETS, styles=STYLES)


@router.get("/coordinates", response_model=DiscoveryResponse)
def discover(
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
    mode: Literal["similar", "popular", "newlife"] = "similar",
    room_size: str | None = None,
    need: str | None = None,
    budget_max: int | None = Query(default=None, ge=1_000, le=1_000_000),
    limit: int = Query(default=12, ge=1, le=50),
) -> DiscoveryResponse:
    context = DiscoveryContext(
        room_size=room_size,
        need=need,
        budget_max=budget_max,
        room_type="ONE_ROOM",
        housing="RENTAL",
        household="SINGLE",
    )
    ranked = rank_coordinates(list_public_coordinates(db), context, mode=mode)[:limit]
    return DiscoveryResponse(
        mode=mode,
        experiment_group="similar" if mode == "similar" else "popular",
        context={"room_size": room_size, "need": need, "budget_max": budget_max},
        results=[coordinate_summary(item, db, session_id, score, reasons) for item, score, reasons in ranked],
    )


@router.get("/coordinates/{coordinate_id}", response_model=CoordinateDetail)
def coordinate_by_id(
    coordinate_id: str,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> CoordinateDetail:
    coordinate = load_coordinate(db, coordinate_id)
    if coordinate.visibility != "PUBLIC" and coordinate.owner_session_id != session_id:
        raise HTTPException(status_code=404, detail="Coordinate not found")
    return coordinate_detail(coordinate, db, session_id)


@router.get("/products", response_model=ProductListResponse)
def products(
    db: Annotated[Session, Depends(get_db)],
    role: str | None = None,
    exclude: str | None = None,
    limit: int = Query(default=12, ge=1, le=40),
) -> ProductListResponse:
    rows = list_products(db, role, exclude, limit)
    return ProductListResponse(results=[ProductSummary.model_validate(row) for row in rows])


@router.get("/products/{product_id}", response_model=ProductDetail)
def product_by_id(
    product_id: str,
    db: Annotated[Session, Depends(get_db)],
    session_id: Annotated[str, Depends(get_session_id)],
) -> ProductDetail:
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    coordinates = [coordinate_summary(item, db, session_id) for item in coordinates_for_product(db, product_id)]
    return ProductDetail(**ProductSummary.model_validate(product).model_dump(), coordinates=coordinates)
