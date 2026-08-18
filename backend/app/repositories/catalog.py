from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models import Coordinate, CoordinateItem, Product


def list_public_coordinates(session: Session) -> list[Coordinate]:
    return list(
        session.execute(
            select(Coordinate)
            .options(
                joinedload(Coordinate.items).joinedload(CoordinateItem.product),
                joinedload(Coordinate.needs),
            )
            .where(Coordinate.visibility == "PUBLIC")
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
            )
            .where(
                CoordinateItem.product_id == product_id,
                Coordinate.visibility == "PUBLIC",
            )
            .order_by(Coordinate.editorial_rank)
        )
        .unique()
        .scalars()
        .all()
    )
