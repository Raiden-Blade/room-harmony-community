from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models import Coordinate, CoordinateItem, Product


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
            .where(Coordinate.visibility == "PUBLIC", Coordinate.moderation_status == "ACTIVE")
        )
        .unique()
        .scalars()
        .all()
    )


def get_product(session: Session, product_id: str) -> Product | None:
    return session.get(Product, product_id)


def list_products(session: Session, role: str | None, exclude: str | None, limit: int) -> list[Product]:
    statement = select(Product).order_by(Product.category, Product.id)
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
            )
            .order_by(Coordinate.editorial_rank)
        )
        .unique()
        .scalars()
        .all()
    )
