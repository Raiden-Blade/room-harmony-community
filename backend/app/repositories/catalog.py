from __future__ import annotations

from sqlalchemy import case, or_, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models import Coordinate, CoordinateItem, Product


def _browsable_visual_condition():
    """Keep seeded illustrations out of photo-led browse surfaces.

    User-owned Coordinates stay visible because an honest empty-image PLAN is
    different from presenting a stock illustration as room evidence.
    """
    return or_(
        Coordinate.owner_session_id.is_not(None),
        Coordinate.image_rights.in_(["EXPLICITLY_PERMITTED", "USER_UPLOADED_LOCAL"]),
    )


def list_public_coordinates(session: Session) -> list[Coordinate]:
    return list(
        session.execute(
            select(Coordinate)
            .options(
                joinedload(Coordinate.items).joinedload(CoordinateItem.product),
                joinedload(Coordinate.needs),
                selectinload(Coordinate.images),
                joinedload(Coordinate.creator),
            )
            .where(
                Coordinate.visibility == "PUBLIC",
                Coordinate.moderation_status == "ACTIVE",
                _browsable_visual_condition(),
            )
        )
        .unique()
        .scalars()
        .all()
    )


def get_product(session: Session, product_id: str) -> Product | None:
    return session.get(Product, product_id)


def list_products(session: Session, role: str | None, exclude: str | None, limit: int) -> list[Product]:
    official_first = case((Product.provenance == "NITORI_OFFICIAL_SNAPSHOT", 0), else_=1)
    statement = select(Product).order_by(official_first, Product.category, Product.id)
    if role:
        statement = statement.where(Product.default_role == role)
    if exclude:
        statement = statement.where(Product.id != exclude)
    return list(session.scalars(statement.limit(limit)).all())


def coordinates_for_product(session: Session, product_id: str) -> list[Coordinate]:
    return list(
        session.execute(
            select(Coordinate)
            .join(CoordinateItem)
            .options(
                joinedload(Coordinate.items).joinedload(CoordinateItem.product),
                joinedload(Coordinate.needs),
                selectinload(Coordinate.images),
                joinedload(Coordinate.creator),
            )
            .where(
                CoordinateItem.product_id == product_id,
                Coordinate.visibility == "PUBLIC",
                Coordinate.moderation_status == "ACTIVE",
                _browsable_visual_condition(),
            )
            .order_by(Coordinate.editorial_rank)
        )
        .unique()
        .scalars()
        .all()
    )
