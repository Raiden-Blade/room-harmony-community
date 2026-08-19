from types import SimpleNamespace

import pytest

from app.ai.openai_provider import OpenAIPlanProvider
from app.ai.provider import AIProviderError
from app.ai.schemas import ProviderSuggestionEnvelope


def test_openai_provider_uses_responses_structured_output_without_storage_or_tools():
    provider = OpenAIPlanProvider(
        api_key="sentinel-fake-secret-never-use",
        model="gpt-5.6",
        timeout=30,
        max_retries=1,
        max_output_tokens=800,
    )
    calls = []
    parsed = ProviderSuggestionEnvelope.model_validate({
        "suggestions": [{
            "strategy": "BALANCED", "action": "KEEP", "target_item_id": 1, "product_id": None,
            "title": "残す", "rationale": "現在の条件に合います。", "tradeoff": "変更はありません。",
        }]
    })
    provider.client = SimpleNamespace(responses=SimpleNamespace(parse=lambda **kwargs: calls.append(kwargs) or SimpleNamespace(output_parsed=parsed)))

    result = provider.generate({"current_items": []})

    assert result == parsed
    assert calls[0]["model"] == "gpt-5.6"
    assert calls[0]["text_format"] is ProviderSuggestionEnvelope
    assert calls[0]["store"] is False
    assert "tools" not in calls[0]
    assert "previous_response_id" not in calls[0]
    assert "sentinel-fake-secret-never-use" not in str(calls[0])


def test_openai_provider_rejects_missing_structured_output():
    provider = OpenAIPlanProvider(
        api_key="sentinel-fake-secret-never-use",
        model="gpt-5.6",
        timeout=30,
        max_retries=1,
        max_output_tokens=800,
    )
    provider.client = SimpleNamespace(
        responses=SimpleNamespace(parse=lambda **_: SimpleNamespace(output_parsed=None))
    )

    with pytest.raises(AIProviderError) as caught:
        provider.generate({"current_items": []})

    assert caught.value.code == "AI_INVALID_RESPONSE"


def test_unexpected_provider_details_are_replaced_with_safe_message():
    provider = OpenAIPlanProvider(
        api_key="sentinel-fake-secret-never-use",
        model="gpt-5.6",
        timeout=30,
        max_retries=1,
        max_output_tokens=800,
    )

    def fail(**_):
        raise RuntimeError("upstream payload sentinel-private-provider-detail")

    provider.client = SimpleNamespace(responses=SimpleNamespace(parse=fail))
    with pytest.raises(AIProviderError) as caught:
        provider.generate({"current_items": []})

    assert caught.value.code == "AI_PROVIDER_ERROR"
    assert "sentinel-private-provider-detail" not in caught.value.safe_message
