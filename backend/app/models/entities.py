from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Product(Base):
    __tablename__ = "products"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    category: Mapped[str] = mapped_column(String(64), index=True)
    default_role: Mapped[str] = mapped_column(String(64))
    price_snapshot: Mapped[int | None] = mapped_column(Integer, nullable=True)
    price_status: Mapped[str] = mapped_column(String(32), default="DEMO_SNAPSHOT")
    price_observed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    official_url: Mapped[str] = mapped_column(String(500))
    image_url: Mapped[str] = mapped_column(String(500))
    provenance: Mapped[str] = mapped_column(String(32), default="DEMO")
    rights_status: Mapped[str] = mapped_column(String(64), default="LOCALLY_CREATED_DEMO")

    items: Mapped[list[CoordinateItem]] = relationship(back_populates="product")


class Coordinate(Base):
    __tablename__ = "coordinates"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    owner_session_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    parent_coordinate_id: Mapped[str | None] = mapped_column(ForeignKey("coordinates.id"), nullable=True)
    kind: Mapped[str] = mapped_column(String(16), index=True)
    status: Mapped[str] = mapped_column(String(32))
    visibility: Mapped[str] = mapped_column(String(16), default="PUBLIC")
    title: Mapped[str] = mapped_column(String(180))
    description: Mapped[str] = mapped_column(Text)
    room_type: Mapped[str] = mapped_column(String(32), index=True)
    size_band: Mapped[str] = mapped_column(String(32), index=True)
    housing_type: Mapped[str] = mapped_column(String(32), index=True)
    household: Mapped[str] = mapped_column(String(32), index=True)
    budget_band: Mapped[str] = mapped_column(String(32), index=True)
    budget_max: Mapped[int] = mapped_column(Integer)
    style: Mapped[str] = mapped_column(String(32), index=True)
    provenance: Mapped[str] = mapped_column(String(32))
    verification_state: Mapped[str] = mapped_column(String(48))
    creator_display: Mapped[str] = mapped_column(String(80))
    creator_type: Mapped[str] = mapped_column(String(32))
    image_url: Mapped[str] = mapped_column(String(500))
    image_rights: Mapped[str] = mapped_column(String(64))
    demo_disclosure: Mapped[str] = mapped_column(String(240))
    seasonal_collection: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    editorial_rank: Mapped[int] = mapped_column(Integer, default=999)
    official_pick: Mapped[bool] = mapped_column(Boolean, default=False)
    seasonal_recognition: Mapped[str | None] = mapped_column(String(64), nullable=True)
    ready_for_creator_impact: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    items: Mapped[list[CoordinateItem]] = relationship(
        back_populates="coordinate", cascade="all, delete-orphan", order_by="CoordinateItem.position"
    )
    needs: Mapped[list[CoordinateNeed]] = relationship(back_populates="coordinate", cascade="all, delete-orphan")
    parent: Mapped[Coordinate | None] = relationship(remote_side=[id])


class CoordinateNeed(Base):
    __tablename__ = "coordinate_needs"
    __table_args__ = (UniqueConstraint("coordinate_id", "need_code"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    coordinate_id: Mapped[str] = mapped_column(ForeignKey("coordinates.id", ondelete="CASCADE"), index=True)
    need_code: Mapped[str] = mapped_column(String(48), index=True)

    coordinate: Mapped[Coordinate] = relationship(back_populates="needs")


class CoordinateItem(Base):
    __tablename__ = "coordinate_items"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    coordinate_id: Mapped[str] = mapped_column(ForeignKey("coordinates.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[str | None] = mapped_column(ForeignKey("products.id"), nullable=True, index=True)
    role: Mapped[str] = mapped_column(String(48))
    source: Mapped[str] = mapped_column(String(32))
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    price_snapshot: Mapped[int | None] = mapped_column(Integer, nullable=True)
    price_observed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    existing_label: Mapped[str | None] = mapped_column(String(120), nullable=True)
    dimensions: Mapped[str | None] = mapped_column(String(120), nullable=True)
    mutation_state: Mapped[str] = mapped_column(String(16), default="ORIGINAL")
    position: Mapped[int] = mapped_column(Integer, default=0)

    coordinate: Mapped[Coordinate] = relationship(back_populates="items")
    product: Mapped[Product | None] = relationship(back_populates="items")


class CoordinateSave(Base):
    __tablename__ = "coordinate_saves"
    __table_args__ = (UniqueConstraint("session_id", "coordinate_id"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(String(64), index=True)
    coordinate_id: Mapped[str] = mapped_column(ForeignKey("coordinates.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    event_name: Mapped[str] = mapped_column(String(64), index=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)
    session_id: Mapped[str] = mapped_column(String(64), index=True)
    coordinate_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    product_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    experiment_group: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    properties_json: Mapped[str] = mapped_column(Text, default="{}")
