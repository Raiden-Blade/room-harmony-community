from types import SimpleNamespace

import httpx
import pytest
from openai import AuthenticationError, NotFoundError, RateLimitError

from app.ai.openai_provider import OpenAIPlanProvider
from app.ai.provider import AIProviderError
from app.ai.schemas import ProviderSuggestionEnvelope, VisualReview


def _response(status_code: int, error: dict) -> httpx.Response:
    return httpx.Response(
        status_code,
        request=httpx.Request("POST", "https://api.openai.com/v1/responses"),
        headers={"x-request-id": "req_safe_test"},
        json={"error": error},
    )


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

    before = provider.status()
    assert before.reason_code == "NOT_CHECKED"
    assert before.available is True
    assert before.verified is False

    result = provider.generate({"current_items": []})

    assert result == parsed
    assert calls[0]["model"] == "gpt-5.6"
    assert calls[0]["text_format"] is ProviderSuggestionEnvelope
    assert calls[0]["store"] is False
    assert "tools" not in calls[0]
    assert "previous_response_id" not in calls[0]
    assert "sentinel-fake-secret-never-use" not in str(calls[0])
    assert provider.status().reason_code == "READY"
    assert provider.status().verified is True


def test_openai_provider_accepts_an_openai_compatible_base_url():
    provider = OpenAIPlanProvider(
        api_key="sentinel-fake-secret-never-use",
        base_url="https://example.invalid/v1",
        model="gpt-4o-mini",
        timeout=30,
        max_retries=1,
        max_output_tokens=800,
    )

    assert str(provider.client.base_url) == "https://example.invalid/v1/"


def test_visual_review_uses_one_low_detail_image_and_structured_output_without_storage():
    provider = OpenAIPlanProvider(
        api_key="sentinel-fake-secret-never-use",
        model="gpt-4o-mini",
        timeout=30,
        max_retries=1,
        max_output_tokens=1800,
    )
    calls = []
    parsed = VisualReview.model_validate({
        "summary": "中央に視線が集まっています。",
        "observations": [
            {
                "code": "VISUAL_BALANCE", "label": "視覚的な重心",
                "observation": "中央寄りです。", "evidence": "主家具が中央にあります。",
                "suggestion": "収納を少し左へ動かしてください。", "confidence": "HIGH",
            },
            {
                "code": "STYLE_COHERENCE", "label": "スタイルのまとまり",
                "observation": "明度が近いです。", "evidence": "明るい商品画像が続いています。",
                "suggestion": "アクセントを一つに絞ってください。", "confidence": "MEDIUM",
            },
        ],
        "next_action": "収納位置を一度だけ変えて比較してください。",
    })
    provider.client = SimpleNamespace(
        responses=SimpleNamespace(parse=lambda **kwargs: calls.append(kwargs) or SimpleNamespace(output_parsed=parsed))
    )

    result = provider.analyze_visual(
        {"items": [{"product_id": "NTR-SAFE-01"}]},
        "data:image/jpeg;base64,c2FmZQ==",
    )

    assert result == parsed
    assert calls[0]["text_format"] is VisualReview
    assert calls[0]["store"] is False
    assert calls[0]["max_output_tokens"] == 1200
    assert calls[0]["input"][0]["content"][1] == {
        "type": "input_image",
        "image_url": "data:image/jpeg;base64,c2FmZQ==",
        "detail": "low",
    }
    assert "NTR-SAFE-01" in calls[0]["input"][0]["content"][0]["text"]


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


@pytest.mark.parametrize(
    ("error", "expected_code", "expected_reason"),
    [
        (
            {"message": "private rate detail", "type": "rate_limit_error", "code": "rate_limit_exceeded"},
            "AI_PROVIDER_RATE_LIMITED",
            "RATE_LIMITED",
        ),
        (
            {"message": "private quota detail", "type": "insufficient_quota", "code": "insufficient_quota"},
            "AI_QUOTA_EXCEEDED",
            "QUOTA_EXCEEDED",
        ),
    ],
)
def test_rate_limit_and_quota_are_distinguished_without_logging_provider_details(caplog, error, expected_code, expected_reason):
    provider = OpenAIPlanProvider(
        api_key="sentinel-fake-secret-never-use",
        model="gpt-5.6",
        timeout=30,
        max_retries=1,
        max_output_tokens=800,
    )
    response = _response(429, error)

    def fail(**_):
        raise RateLimitError(error["message"], response=response, body=response.json())

    provider.client = SimpleNamespace(responses=SimpleNamespace(parse=fail))
    with pytest.raises(AIProviderError) as caught:
        provider.generate({"current_items": []})

    assert caught.value.code == expected_code
    assert provider.status().reason_code == expected_reason
    assert provider.status().verified is False
    assert provider.status().available is True
    assert error["message"] not in caplog.text
    assert "req_safe_test" in caplog.text


@pytest.mark.parametrize(
    ("exception_type", "status_code", "expected_code", "expected_reason"),
    [
        (AuthenticationError, 401, "AI_AUTH_ERROR", "AUTH_ERROR"),
        (NotFoundError, 404, "AI_MODEL_NOT_AVAILABLE", "MODEL_ERROR"),
    ],
)
def test_persistent_configuration_errors_disable_generation_until_configuration_changes(
    exception_type, status_code, expected_code, expected_reason
):
    provider = OpenAIPlanProvider(
        api_key="sentinel-fake-secret-never-use",
        model="gpt-5.6",
        timeout=30,
        max_retries=1,
        max_output_tokens=800,
    )
    error = {"message": "private configuration detail", "type": "invalid_request_error", "code": "test"}
    response = _response(status_code, error)

    def fail(**_):
        raise exception_type(error["message"], response=response, body=response.json())

    provider.client = SimpleNamespace(responses=SimpleNamespace(parse=fail))
    with pytest.raises(AIProviderError) as caught:
        provider.generate({"current_items": []})

    assert caught.value.code == expected_code
    assert provider.status().reason_code == expected_reason
    assert provider.status().available is False
    assert provider.status().verified is False
