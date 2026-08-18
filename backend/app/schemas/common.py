from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class PriceSummary(BaseModel):
    known_total: int
    unknown_item_count: int
    calculated_at: datetime
    currency: Literal["JPY"] = "JPY"
    status: Literal["DEMO_SNAPSHOT", "PARTIAL_DEMO_SNAPSHOT"]
    notice: str = "表示価格はデモ用スナップショットです。現在の公式価格と異なる場合があります。"


class ProductSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    category: str
    default_role: str
    price_snapshot: int | None
    price_status: str
    price_observed_at: datetime | None
    official_url: str
    image_url: str
    provenance: str
    rights_status: str


class CoordinateItemResponse(BaseModel):
    id: int
    role: str
    source: str
    quantity: int
    price_snapshot: int | None
    price_observed_at: datetime | None
    existing_label: str | None
    dimensions: str | None
    mutation_state: str
    product: ProductSummary | None


class CoordinateSummary(BaseModel):
    id: str
    kind: str
    status: str
    title: str
    description: str
    room_type: str
    size_band: str
    housing_type: str
    household: str
    budget_band: str
    budget_max: int
    style: str
    needs: list[str]
    provenance: str
    verification_state: str
    creator_display: str
    creator_type: str
    image_url: str
    image_rights: str
    demo_disclosure: str
    seasonal_collection: str | None
    official_pick: bool
    price: PriceSummary
    product_count: int
    category_count: int
    match_reasons: list[str] = Field(default_factory=list)
    score: int | None = None
    is_saved: bool = False


class CoordinateDetail(CoordinateSummary):
    parent_coordinate_id: str | None
    owner_session_id: str | None
    items: list[CoordinateItemResponse]
    creator_impact_slot: dict[str, int | bool | None]


class ProductDetail(ProductSummary):
    coordinates: list[CoordinateSummary]


class ProductListResponse(BaseModel):
    results: list[ProductSummary]


class DiscoveryResponse(BaseModel):
    mode: Literal["similar", "popular", "newlife"]
    experiment_group: Literal["similar", "popular"]
    context: dict[str, str | int | None]
    results: list[CoordinateSummary]


class SaveResponse(BaseModel):
    coordinate_id: str
    saved: bool


class CreatePlanRequest(BaseModel):
    budget_max: int | None = Field(default=None, ge=1000, le=1_000_000)


class ExistingFurnitureRequest(BaseModel):
    label: str = Field(min_length=1, max_length=80)
    category: str = Field(min_length=1, max_length=48)
    dimensions: str | None = Field(default=None, max_length=80)

    @field_validator("label", "category", "dimensions")
    @classmethod
    def reject_control_characters(cls, value: str | None) -> str | None:
        if value is not None and any(ord(char) < 32 for char in value):
            raise ValueError("control characters are not allowed")
        return value


class ReplaceItemRequest(BaseModel):
    product_id: str = Field(min_length=1, max_length=64)


class AddItemRequest(BaseModel):
    product_id: str = Field(min_length=1, max_length=64)
    role: str = Field(min_length=1, max_length=48)


class HandoffRequest(BaseModel):
    anchor_product_id: str | None = None
    store_id: str | None = Field(default=None, max_length=64)
    return_url: str = Field(default="/saved", max_length=300)

    @field_validator("return_url")
    @classmethod
    def allow_only_local_return(cls, value: str) -> str:
        if not value.startswith("/") or value.startswith("//"):
            raise ValueError("return_url must be a local path")
        return value


class HandoffPayload(BaseModel):
    schema_version: Literal["1.0"] = "1.0"
    handoff_id: str
    source: Literal["room-harmony-community"] = "room-harmony-community"
    coordinate_id: str
    coordinate_kind: Literal["PLAN"] = "PLAN"
    product_ids: list[str] = Field(min_length=1)
    anchor_product_id: str
    store_id: str | None
    intent: Literal["COMPARE_IN_STORE"] = "COMPARE_IN_STORE"
    return_url: str
    expires_at: datetime
    live_integration: Literal[False] = False
    notice: str = "デモ用プレビューです。Room Harmonyへは送信されません。"


ALLOWED_EVENT_NAMES = {
    "session_start",
    "home_view",
    "context_select",
    "discovery_impression",
    "coordinate_view",
    "match_reason_view",
    "product_view",
    "product_to_coordinate",
    "coordinate_save",
    "plan_start",
    "plan_item_keep",
    "plan_item_replace",
    "plan_item_add",
    "existing_furniture_add",
    "plan_ready",
    "ec_action",
    "store_action",
    "room_harmony_handoff",
    # Reserved for a future creator program. The MVP has no public reaction UI.
    "creator_coordinate_impression",
    "creator_attributed_save",
    "creator_attributed_plan_start",
}

ALLOWED_EVENT_PROPERTIES = {
    "mode",
    "placement",
    "rank",
    "room_size",
    "need",
    "budget_max",
    "match_dimensions",
    "role",
    "category",
    "category_count",
    "product_count",
    "destination",
    "mutation",
}


class AnalyticsEventRequest(BaseModel):
    event_name: str
    occurred_at: datetime | None = None
    coordinate_id: str | None = Field(default=None, max_length=64)
    product_id: str | None = Field(default=None, max_length=64)
    experiment_group: str | None = Field(default=None, max_length=32)
    properties: dict[str, str | int | bool | list[str]] = Field(default_factory=dict)

    @field_validator("event_name")
    @classmethod
    def known_event(cls, value: str) -> str:
        if value not in ALLOWED_EVENT_NAMES:
            raise ValueError("unknown analytics event")
        return value

    @field_validator("properties")
    @classmethod
    def safe_properties(cls, value: dict[str, object]) -> dict[str, object]:
        unknown = set(value) - ALLOWED_EVENT_PROPERTIES
        if unknown:
            raise ValueError(f"unsupported analytics properties: {sorted(unknown)}")
        for item in value.values():
            strings = item if isinstance(item, list) else [item]
            if any(isinstance(text, str) and len(text) > 64 for text in strings):
                raise ValueError("analytics text values must be enum-like and at most 64 characters")
        return value


class AnalyticsEventResponse(BaseModel):
    accepted: bool = True
    event_name: str


class KpiReadinessResponse(BaseModel):
    disclaimer: str
    event_counts: dict[str, int]
    measurement_support: dict[str, dict[str, int | bool]]


class OptionsResponse(BaseModel):
    room_sizes: list[dict[str, str]]
    needs: list[dict[str, str]]
    budgets: list[dict[str, str | int]]
    styles: list[dict[str, str]]
