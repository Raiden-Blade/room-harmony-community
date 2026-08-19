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
    style_hint: Mapped[str | None] = mapped_column(String(32), nullable=True)

    items: Mapped[list[CoordinateItem]] = relationship(back_populates="product")


class CreatorProfile(Base):
    __tablename__ = "creator_profiles"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    owner_session_id: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    display_name: Mapped[str] = mapped_column(String(60))
    bio: Mapped[str | None] = mapped_column(String(240), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    coordinates: Mapped[list[Coordinate]] = relationship(back_populates="creator")
    challenge_entries: Mapped[list[ChallengeEntry]] = relationship(back_populates="creator")


class Coordinate(Base):
    __tablename__ = "coordinates"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    owner_session_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    creator_id: Mapped[str | None] = mapped_column(ForeignKey("creator_profiles.id"), nullable=True, index=True)
    parent_coordinate_id: Mapped[str | None] = mapped_column(ForeignKey("coordinates.id"), nullable=True)
    root_coordinate_id: Mapped[str | None] = mapped_column(ForeignKey("coordinates.id"), nullable=True, index=True)
    derivation_type: Mapped[str | None] = mapped_column(String(48), nullable=True, index=True)
    remix_note: Mapped[str | None] = mapped_column(String(240), nullable=True)
    kind: Mapped[str] = mapped_column(String(16), index=True)
    status: Mapped[str] = mapped_column(String(32))
    visibility: Mapped[str] = mapped_column(String(16), default="PUBLIC")
    moderation_status: Mapped[str] = mapped_column(String(16), default="ACTIVE", index=True)
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
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    unpublished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    items: Mapped[list[CoordinateItem]] = relationship(
        back_populates="coordinate", cascade="all, delete-orphan", order_by="CoordinateItem.position"
    )
    needs: Mapped[list[CoordinateNeed]] = relationship(back_populates="coordinate", cascade="all, delete-orphan")
    images: Mapped[list[CoordinateImage]] = relationship(
        back_populates="coordinate", cascade="all, delete-orphan", order_by="CoordinateImage.sort_order"
    )
    creator: Mapped[CreatorProfile | None] = relationship(back_populates="coordinates")
    parent: Mapped[Coordinate | None] = relationship(remote_side=[id], foreign_keys=[parent_coordinate_id])
    challenge_entries: Mapped[list[ChallengeEntry]] = relationship(back_populates="coordinate")


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


class CoordinateImage(Base):
    __tablename__ = "coordinate_images"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    coordinate_id: Mapped[str | None] = mapped_column(
        ForeignKey("coordinates.id", ondelete="CASCADE"), nullable=True, index=True
    )
    owner_session_id: Mapped[str] = mapped_column(String(64), index=True)
    storage_name: Mapped[str] = mapped_column(String(100), unique=True)
    mime_type: Mapped[str] = mapped_column(String(32), default="image/webp")
    width: Mapped[int] = mapped_column(Integer)
    height: Mapped[int] = mapped_column(Integer)
    size_bytes: Mapped[int] = mapped_column(Integer)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    coordinate: Mapped[Coordinate | None] = relationship(back_populates="images")


class HelpfulReaction(Base):
    __tablename__ = "helpful_reactions"
    __table_args__ = (UniqueConstraint("session_id", "coordinate_id"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(String(64), index=True)
    coordinate_id: Mapped[str] = mapped_column(ForeignKey("coordinates.id", ondelete="CASCADE"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class ContentReport(Base):
    __tablename__ = "content_reports"
    __table_args__ = (UniqueConstraint("session_id", "coordinate_id"),)

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(String(64), index=True)
    coordinate_id: Mapped[str] = mapped_column(ForeignKey("coordinates.id", ondelete="CASCADE"), index=True)
    reason: Mapped[str] = mapped_column(String(32), index=True)
    status: Mapped[str] = mapped_column(String(16), default="OPEN", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class Challenge(Base):
    __tablename__ = "challenges"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    slug: Mapped[str] = mapped_column(String(96), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(180))
    description: Mapped[str] = mapped_column(Text)
    why_it_matters: Mapped[str] = mapped_column(Text)
    theme: Mapped[str] = mapped_column(String(64), index=True)
    season: Mapped[str] = mapped_column(String(16), index=True)
    year: Mapped[int] = mapped_column(Integer, index=True)
    challenge_type: Mapped[str] = mapped_column(String(32), index=True)
    status: Mapped[str] = mapped_column(String(16), index=True)
    start_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    end_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    archive_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    cover_asset: Mapped[str] = mapped_column(String(500))
    eligibility_json: Mapped[str] = mapped_column(Text, default="{}")
    constraints_json: Mapped[str] = mapped_column(Text, default="[]")
    provenance: Mapped[str] = mapped_column(String(32), default="DEMO")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    entries: Mapped[list[ChallengeEntry]] = relationship(back_populates="challenge")


class ChallengeEntry(Base):
    __tablename__ = "challenge_entries"
    __table_args__ = (UniqueConstraint("challenge_id", "coordinate_id"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    challenge_id: Mapped[str] = mapped_column(ForeignKey("challenges.id"), index=True)
    coordinate_id: Mapped[str] = mapped_column(ForeignKey("coordinates.id"), index=True)
    creator_id: Mapped[str | None] = mapped_column(ForeignKey("creator_profiles.id"), nullable=True, index=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    status: Mapped[str] = mapped_column(String(16), default="ACTIVE", index=True)
    recognition: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    provenance: Mapped[str] = mapped_column(String(32), default="USER")
    withdrawn_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    challenge: Mapped[Challenge] = relationship(back_populates="entries")
    coordinate: Mapped[Coordinate] = relationship(back_populates="challenge_entries")
    creator: Mapped[CreatorProfile | None] = relationship(back_populates="challenge_entries")


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    event_name: Mapped[str] = mapped_column(String(64), index=True)
    occurred_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, index=True)
    session_id: Mapped[str] = mapped_column(String(64), index=True)
    coordinate_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    product_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    # Keep the existing SQLite column name so local demo databases remain
    # readable, while exposing the honest domain term in Python/API code.
    comparison_condition: Mapped[str | None] = mapped_column(
        "experiment_group", String(32), nullable=True, index=True
    )
    properties_json: Mapped[str] = mapped_column(Text, default="{}")


class UserPreferenceProfile(Base):
    __tablename__ = "user_preference_profiles"

    owner_session_id: Mapped[str] = mapped_column(String(64), primary_key=True)
    room_size: Mapped[str] = mapped_column(String(32))
    housing_type: Mapped[str] = mapped_column(String(32))
    budget_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    needs_json: Mapped[str] = mapped_column(Text, default="[]")
    preferred_style: Mapped[str | None] = mapped_column(String(32), nullable=True)
    priority_focus: Mapped[str] = mapped_column(String(32), default="BALANCED")
    preserve_existing_furniture: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class AISuggestionPreview(Base):
    __tablename__ = "ai_suggestion_previews"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    owner_session_id: Mapped[str] = mapped_column(String(64), index=True)
    plan_id: Mapped[str] = mapped_column(String(64), index=True)
    fingerprint: Mapped[str] = mapped_column(String(64))
    suggestion_json: Mapped[str] = mapped_column(Text)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    applied_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
