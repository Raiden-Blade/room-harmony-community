import pytest
from pydantic import ValidationError

from app.schemas.common import AnalyticsEventRequest


def test_known_event_and_enum_properties_are_valid():
    event = AnalyticsEventRequest(
        event_name="product_view",
        product_id="DEMO-BED-01",
        properties={"category": "BED", "rank": 1},
    )
    assert event.event_name == "product_view"

    seasonal = AnalyticsEventRequest(
        event_name="challenge_entry_complete",
        coordinate_id="community-11111111-1111-1111-1111-111111111111",
        properties={
            "challenge_id": "challenge-newlife-2028",
            "season": "SPRING",
            "challenge_type": "LIFE_EVENT",
        },
    )
    assert seasonal.properties["challenge_id"] == "challenge-newlife-2028"

    ai = AnalyticsEventRequest(
        event_name="ai_suggestion_apply",
        coordinate_id="plan-11111111-1111-1111-1111-111111111111",
        properties={
            "strategy": "BALANCED",
            "action": "REPLACE",
            "before_score_bucket": "MEDIUM",
            "after_score_bucket": "HIGH",
        },
    )
    assert ai.properties["action"] == "REPLACE"

    global_discovery = AnalyticsEventRequest(
        event_name="global_lens_select",
        properties={"global_lens": "JP", "placement": "HOME", "rank": 1},
    )
    assert global_discovery.properties["global_lens"] == "JP"


def test_unknown_event_is_rejected():
    with pytest.raises(ValidationError):
        AnalyticsEventRequest(event_name="user_free_text", properties={})


def test_free_text_property_is_rejected():
    with pytest.raises(ValidationError):
        AnalyticsEventRequest(event_name="product_view", properties={"comment": "private room details"})

    with pytest.raises(ValidationError):
        AnalyticsEventRequest(event_name="product_view", properties={"category": "my private room"})

    with pytest.raises(ValidationError):
        AnalyticsEventRequest(event_name="fit_score_view", properties={"before_score_bucket": "82 points"})

    with pytest.raises(ValidationError):
        AnalyticsEventRequest(event_name="global_lens_select", properties={"global_lens": "free text"})


def test_free_text_identifiers_are_rejected():
    with pytest.raises(ValidationError):
        AnalyticsEventRequest(event_name="coordinate_view", coordinate_id="my private room")

    with pytest.raises(ValidationError):
        AnalyticsEventRequest(event_name="product_view", product_id="secret product note")

    with pytest.raises(ValidationError):
        AnalyticsEventRequest(
            event_name="challenge_view",
            properties={"challenge_id": "my private challenge note"},
        )
