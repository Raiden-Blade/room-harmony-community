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


def test_unknown_event_is_rejected():
    with pytest.raises(ValidationError):
        AnalyticsEventRequest(event_name="user_free_text", properties={})


def test_free_text_property_is_rejected():
    with pytest.raises(ValidationError):
        AnalyticsEventRequest(event_name="product_view", properties={"comment": "private room details"})

    with pytest.raises(ValidationError):
        AnalyticsEventRequest(event_name="product_view", properties={"category": "my private room"})


def test_free_text_identifiers_are_rejected():
    with pytest.raises(ValidationError):
        AnalyticsEventRequest(event_name="coordinate_view", coordinate_id="my private room")

    with pytest.raises(ValidationError):
        AnalyticsEventRequest(event_name="product_view", product_id="secret product note")
