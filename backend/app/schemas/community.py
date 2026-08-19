from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from app.schemas.common import CoordinateSummary, CreatorImpactSummary
from app.schemas.seasonal import CreatorSeasonalSummary


CoordinateKind = Literal["REAL", "PLAN"]
DerivationType = Literal[
    "LOWER_BUDGET",
    "SMALLER_ROOM",
    "COLOR_VARIATION",
    "STORAGE_FOCUS",
    "EXISTING_FURNITURE",
    "PRODUCT_SUBSTITUTION",
    "OTHER",
]
ReportReason = Literal["INAPPROPRIATE", "PRIVACY", "MISLEADING", "COPYRIGHT", "SPAM", "OTHER"]
ProductRole = Literal[
    "MAIN_FURNITURE",
    "SUPPORT_FURNITURE",
    "STORAGE",
    "LIGHTING",
    "TEXTILE",
    "ACCESSORY",
    "OTHER",
]


def _safe_text(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    if any(ord(char) < 32 and char not in "\n\t" for char in cleaned):
        raise ValueError("control characters are not allowed")
    return cleaned


class CreatorUpsertRequest(BaseModel):
    display_name: str = Field(min_length=1, max_length=60)
    bio: str | None = Field(default=None, max_length=240)

    _clean = field_validator("display_name", "bio")(_safe_text)


class CreatorProfileResponse(BaseModel):
    id: str
    display_name: str
    bio: str | None
    contribution_count: int
    impact: CreatorImpactSummary
    created_at: datetime
    contributions: list[CoordinateSummary]
    is_owner: bool
    seasonal: CreatorSeasonalSummary = Field(default_factory=CreatorSeasonalSummary)


class ImageUploadResponse(BaseModel):
    id: str
    url: str
    mime_type: Literal["image/webp"] = "image/webp"
    width: int
    height: int
    size_bytes: int


class ProductTagRequest(BaseModel):
    product_id: str = Field(pattern=r"^(?:DEMO|NTR)-[A-Za-z0-9-]+$", max_length=64)
    role: ProductRole
    quantity: int = Field(default=1, ge=1, le=9)


class ExistingFurnitureInput(BaseModel):
    label: str = Field(min_length=1, max_length=80)
    category: ProductRole
    dimensions: str | None = Field(default=None, max_length=80)

    _clean = field_validator("label", "dimensions")(_safe_text)


class CreateCoordinateRequest(BaseModel):
    kind: CoordinateKind
    title: str = Field(min_length=1, max_length=180)
    description: str | None = Field(default=None, max_length=800)
    room_type: str | None = Field(default=None, max_length=32)
    size_band: str | None = Field(default=None, max_length=32)
    housing_type: str | None = Field(default=None, max_length=32)
    household: str | None = Field(default=None, max_length=32)
    budget_max: int | None = Field(default=None, ge=1_000, le=1_000_000)
    style: str | None = Field(default=None, max_length=32)
    needs: list[str] = Field(default_factory=list, max_length=6)
    products: list[ProductTagRequest] = Field(default_factory=list, max_length=20)
    existing_furniture: list[ExistingFurnitureInput] = Field(default_factory=list, max_length=20)
    image_ids: list[str] = Field(default_factory=list, max_length=5)
    parent_coordinate_id: str | None = Field(default=None, max_length=64)
    derivation_type: DerivationType | None = None
    remix_note: str | None = Field(default=None, max_length=200)

    _clean = field_validator(
        "title",
        "description",
        "room_type",
        "size_band",
        "housing_type",
        "household",
        "style",
        "remix_note",
    )(_safe_text)

    @field_validator("needs")
    @classmethod
    def controlled_needs(cls, value: list[str]) -> list[str]:
        allowed = {"STORAGE", "LOW_BUDGET", "WORK_FROM_HOME", "RELAX", "SLEEP", "COMPACT"}
        if any(item not in allowed for item in value):
            raise ValueError("unsupported need")
        return list(dict.fromkeys(value))

    @field_validator("image_ids")
    @classmethod
    def controlled_image_ids(cls, value: list[str]) -> list[str]:
        if any(not item.startswith("image-") or len(item) > 64 for item in value):
            raise ValueError("invalid image identifier")
        if len(set(value)) != len(value):
            raise ValueError("duplicate image identifier")
        return value

    @model_validator(mode="after")
    def consistent_derivation(self):
        if bool(self.parent_coordinate_id) != bool(self.derivation_type):
            raise ValueError("parent_coordinate_id and derivation_type must be supplied together")
        if not self.products and not self.existing_furniture:
            raise ValueError("Coordinate requires at least one product or existing furniture item")
        return self


class CoordinateUpdateRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=180)
    description: str | None = Field(default=None, max_length=800)
    room_type: str | None = Field(default=None, max_length=32)
    size_band: str | None = Field(default=None, max_length=32)
    housing_type: str | None = Field(default=None, max_length=32)
    household: str | None = Field(default=None, max_length=32)
    budget_max: int | None = Field(default=None, ge=1_000, le=1_000_000)
    style: str | None = Field(default=None, max_length=32)
    parent_coordinate_id: str | None = Field(default=None, max_length=64)
    derivation_type: DerivationType | None = None
    remix_note: str | None = Field(default=None, max_length=200)

    _clean = field_validator(
        "title",
        "description",
        "room_type",
        "size_band",
        "housing_type",
        "household",
        "style",
        "remix_note",
    )(_safe_text)


class PublishPlanRequest(BaseModel):
    kind: CoordinateKind
    image_ids: list[str] = Field(default_factory=list, max_length=5)
    derivation_type: DerivationType
    remix_note: str | None = Field(default=None, max_length=200)

    _clean = field_validator("remix_note")(_safe_text)

    @field_validator("image_ids")
    @classmethod
    def controlled_image_ids(cls, value: list[str]) -> list[str]:
        if any(not item.startswith("image-") or len(item) > 64 for item in value):
            raise ValueError("invalid image identifier")
        if len(set(value)) != len(value):
            raise ValueError("duplicate image identifier")
        return value


class HelpfulResponse(BaseModel):
    coordinate_id: str
    helpful: bool
    helpful_count: int


class ReportRequest(BaseModel):
    reason: ReportReason


class ReportResponse(BaseModel):
    accepted: bool = True
    coordinate_id: str
    reason: ReportReason
    moderation_status: Literal["ACTIVE"] = "ACTIVE"
