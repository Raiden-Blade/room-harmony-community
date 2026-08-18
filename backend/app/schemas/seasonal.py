from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import CoordinateSummary


Season = Literal["SPRING", "SUMMER", "AUTUMN", "WINTER"]
ChallengeType = Literal["LIFE_EVENT", "CONSTRAINT", "ADAPT_REMIX"]
ChallengeStatus = Literal["UPCOMING", "ACTIVE", "ENDED", "ARCHIVED"]
EntryStatus = Literal["ACTIVE", "WITHDRAWN", "HIDDEN"]
Recognition = Literal[
    "OFFICIAL_PICK",
    "USEFUL_REUSE",
    "SMART_BUDGET",
    "SMALL_SPACE_IDEA",
    "EXISTING_FURNITURE",
    "REAL_ROOM_STORY",
]


class ChallengeEligibility(BaseModel):
    size_bands: list[str] = Field(default_factory=list)
    households: list[str] = Field(default_factory=list)
    housing_types: list[str] = Field(default_factory=list)
    budget_max: int | None = Field(default=None, ge=1_000, le=1_000_000)
    kinds: list[Literal["REAL", "PLAN"]] = Field(default_factory=lambda: ["REAL", "PLAN"])
    image_required: bool = False
    min_product_count: int | None = Field(default=None, ge=1, le=20)


class ChallengeConstraint(BaseModel):
    code: Literal[
        "SIZE_BAND",
        "HOUSEHOLD",
        "HOUSING_TYPE",
        "BUDGET_MAX",
        "KIND",
        "IMAGE_REQUIRED",
        "MIN_PRODUCT_COUNT",
    ]
    operator: Literal["IN", "LTE", "EQ", "GTE"]
    values: list[str | int | bool]
    label: str = Field(min_length=1, max_length=120)


class ChallengeSummary(BaseModel):
    id: str
    slug: str
    title: str
    description: str
    theme: str
    season: Season
    year: int
    challenge_type: ChallengeType
    status: ChallengeStatus
    start_at: datetime
    end_at: datetime
    archive_at: datetime
    cover_asset: str
    provenance: Literal["DEMO"]
    constraints: list[ChallengeConstraint]
    constraint_summary: str
    entry_count: int


class ChallengeEntryResponse(BaseModel):
    id: str
    challenge_id: str
    coordinate_id: str
    creator_id: str | None
    submitted_at: datetime
    status: EntryStatus
    recognition: Recognition | None
    provenance: Literal["DEMO", "USER", "PROTOTYPE_PICK"]
    coordinate: CoordinateSummary


class ChallengeCandidate(BaseModel):
    coordinate: CoordinateSummary
    eligible: bool
    rejection_codes: list[str] = Field(default_factory=list)
    rejection_messages: list[str] = Field(default_factory=list)
    already_entered: bool = False


class ChallengeDetail(ChallengeSummary):
    why_it_matters: str
    eligibility: ChallengeEligibility
    participation_count: int
    real_count: int
    plan_count: int
    entries: list[ChallengeEntryResponse]
    prototype_picks: list[ChallengeEntryResponse]
    my_candidates: list[ChallengeCandidate]


class ChallengeListResponse(BaseModel):
    results: list[ChallengeSummary]


class SeasonalLandingResponse(BaseModel):
    concept_label: Literal["Seasonal Growth Concept"] = "Seasonal Growth Concept"
    featured: ChallengeSummary | None
    active: list[ChallengeSummary]
    upcoming: list[ChallengeSummary]
    ended: list[ChallengeSummary]
    archived: list[ChallengeSummary]
    constraint_themes: list[ChallengeSummary]
    previous_year_coordinates: list[CoordinateSummary]
    notice: str = "すべてSynthetic dataによるFunctional Prototypeです。NITORI公式施策・公式選定ではありません。"


class ChallengeEntryRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    coordinate_id: str = Field(pattern=r"^(?:coord-[A-Za-z0-9_-]+|community-[0-9a-fA-F-]{36})$", max_length=64)


class CreatorChallengeParticipation(BaseModel):
    challenge_id: str
    challenge_slug: str
    challenge_title: str
    season: Season
    year: int
    coordinate_id: str
    coordinate_title: str
    recognition: Recognition | None
    provenance: Literal["DEMO", "USER", "PROTOTYPE_PICK"]


class CreatorSeasonalSummary(BaseModel):
    challenge_entries: int = 0
    recognized_coordinates: int = 0
    seasonal_reuse_count: int = 0
    participations: list[CreatorChallengeParticipation] = Field(default_factory=list)
