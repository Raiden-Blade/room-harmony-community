from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator


RoomSize = Literal["TINY_5_5", "SMALL_6", "MEDIUM_7_8"]
Need = Literal["STORAGE", "LOW_BUDGET", "WORK_FROM_HOME", "RELAX", "SLEEP", "COMPACT"]
Style = Literal["NATURAL", "CLEAR_COOL", "DANDY", "ELEGANT", "COZY", "COLORFUL"]
Priority = Literal["BALANCED", "BUDGET", "NEEDS", "EXISTING_FURNITURE", "STYLE"]
Strategy = Literal["PREFERENCE_SAFE", "BALANCED", "DISCOVERY"]
Action = Literal["KEEP", "REPLACE", "ADD", "REMOVE"]


class PreferenceProfileInput(BaseModel):
    room_size: RoomSize
    housing_type: Literal["RENTAL", "OWNED", "OTHER"]
    budget_max: int | None = Field(default=None, ge=1_000, le=1_000_000)
    needs: list[Need] = Field(default_factory=list, max_length=6)
    preferred_style: Style | None = None
    priority_focus: Priority = "BALANCED"
    preserve_existing_furniture: bool = False

    @field_validator("needs")
    @classmethod
    def unique_needs(cls, value: list[str]) -> list[str]:
        if len(set(value)) != len(value):
            raise ValueError("needs must be unique")
        return value


class PreferenceProfile(PreferenceProfileInput):
    source: Literal["PLAN_DEFAULT", "SAVED_PROFILE"]


class FitAxis(BaseModel):
    code: Literal["BUDGET", "NEEDS", "EXISTING_FURNITURE", "STYLE", "COMPOSITION"]
    label: str
    score: int | None
    available: bool
    base_weight: int
    applied_weight: float
    evidence: list[str] = Field(default_factory=list)
    reason: str


class FitAssessment(BaseModel):
    policy_version: str
    overall_score: int
    axes: list[FitAxis]
    summary: str
    fingerprint: str


class AIContractContext(BaseModel):
    policy_version: str
    allowed_strategies: list[Strategy]
    allowed_actions: list[Action]
    principles: list[str]


class AIPlanItemContext(BaseModel):
    item_id: int | None
    product_id: str | None
    name: str
    role: str
    category: str
    source: str
    mutation_state: str
    quantity: int
    price: int | None
    provenance: str | None
    style_hint: str | None
    price_observed_at: str | None


class AICandidateProductContext(BaseModel):
    product_id: str
    name: str
    role: str
    category: str
    price_snapshot: int
    price_observed_at: str
    style_hint: str | None


class AIPlanContext(BaseModel):
    contract: AIContractContext
    preference_profile: PreferenceProfileInput
    current_fit: FitAssessment
    current_items: list[AIPlanItemContext]
    allowed_products: list[AICandidateProductContext] = Field(max_length=18)


class AIStatus(BaseModel):
    enabled: bool
    configured: bool
    available: bool
    reason_code: Literal["READY", "DISABLED", "KEY_MISSING", "AUTH_ERROR", "PROVIDER_ERROR"]
    model: str


class ProviderSuggestion(BaseModel):
    strategy: Strategy
    action: Action
    target_item_id: int | None
    product_id: str | None
    title: str = Field(min_length=1, max_length=64)
    rationale: str = Field(min_length=1, max_length=180)
    tradeoff: str = Field(min_length=1, max_length=140)


class ProviderSuggestionEnvelope(BaseModel):
    suggestions: list[ProviderSuggestion] = Field(min_length=1, max_length=3)


class AISuggestionRequest(BaseModel):
    profile: PreferenceProfileInput | None = None


class AIProductRef(BaseModel):
    item_id: int | None = None
    product_id: str
    name: str
    role: str
    price_snapshot: int | None


class AISuggestion(BaseModel):
    id: str
    strategy: Strategy
    action: Action
    title: str
    rationale: str
    tradeoff: str
    target: AIProductRef | None
    proposed_product: AIProductRef | None
    before_price: int
    after_price: int
    price_delta: int
    before_fit: FitAssessment
    after_fit: FitAssessment


class AISuggestionResponse(BaseModel):
    policy_version: str
    profile: PreferenceProfile
    current_fit: FitAssessment
    suggestions: list[AISuggestion]


class AIApplyRequest(BaseModel):
    suggestion_id: str = Field(pattern=r"^ai-preview-[0-9a-f-]{36}$")


class AIApplyResult(BaseModel):
    suggestion: AISuggestion
    before_fit: FitAssessment
    after_fit: FitAssessment


class AIErrorDetail(BaseModel):
    code: str
    message: str
