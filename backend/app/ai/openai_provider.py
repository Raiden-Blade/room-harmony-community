from __future__ import annotations

import json
import logging

from openai import APIConnectionError, APIStatusError, APITimeoutError, AuthenticationError, OpenAI, RateLimitError

from app.ai.policy import SYSTEM_INSTRUCTIONS, VISUAL_SYSTEM_INSTRUCTIONS
from app.ai.provider import AIProviderError
from app.ai.schemas import AIStatus, ProviderSuggestionEnvelope, VisualReview


logger = logging.getLogger(__name__)


class OpenAIPlanProvider:
    def __init__(
        self,
        *,
        api_key: str,
        model: str,
        timeout: float,
        max_retries: int,
        max_output_tokens: int,
        base_url: str | None = None,
    ):
        self.model = model
        self.max_output_tokens = max_output_tokens
        # A configured key is not proof of a successful provider connection.
        # The first real generation request moves this state to READY or to a
        # controlled failure reason.
        self._reason_code = "NOT_CHECKED"
        self.client = OpenAI(
            api_key=api_key,
            base_url=base_url,
            timeout=timeout,
            max_retries=max_retries,
        )

    def status(self) -> AIStatus:
        return AIStatus(
            enabled=True,
            configured=True,
            available=self._reason_code not in {"AUTH_ERROR", "MODEL_ERROR", "REQUEST_ERROR"},
            verified=self._reason_code == "READY",
            reason_code=self._reason_code,
            model=self.model,
        )

    def _record_failure(self, reason_code: str, exc: Exception | None = None) -> None:
        self._reason_code = reason_code
        logger.warning(
            "OpenAI PLAN request failed reason=%s status=%s request_id=%s",
            reason_code,
            getattr(exc, "status_code", None),
            getattr(exc, "request_id", None),
        )

    @staticmethod
    def _is_quota_error(exc: RateLimitError) -> bool:
        body = getattr(exc, "body", None)
        if not isinstance(body, dict):
            return False
        error = body.get("error")
        if not isinstance(error, dict):
            return False
        return error.get("code") == "insufficient_quota" or error.get("type") == "insufficient_quota"

    def generate(self, context: dict) -> ProviderSuggestionEnvelope:
        try:
            response = self.client.responses.parse(
                model=self.model,
                instructions=SYSTEM_INSTRUCTIONS,
                input=json.dumps(context, ensure_ascii=False, separators=(",", ":")),
                text_format=ProviderSuggestionEnvelope,
                store=False,
                max_output_tokens=self.max_output_tokens,
            )
            parsed = response.output_parsed
            if parsed is None:
                self._record_failure("PROVIDER_ERROR")
                raise AIProviderError("AI_INVALID_RESPONSE", "AIの提案形式を確認できませんでした。", 502)
            self._reason_code = "READY"
            return parsed
        except AuthenticationError as exc:
            self._record_failure("AUTH_ERROR", exc)
            raise AIProviderError("AI_AUTH_ERROR", "AI用APIキーを確認してください。", 503) from exc
        except RateLimitError as exc:
            if self._is_quota_error(exc):
                self._record_failure("QUOTA_EXCEEDED", exc)
                raise AIProviderError(
                    "AI_QUOTA_EXCEEDED",
                    "API利用枠または請求設定を確認してください。",
                    503,
                ) from exc
            self._record_failure("RATE_LIMITED", exc)
            raise AIProviderError(
                "AI_PROVIDER_RATE_LIMITED",
                "APIのリクエスト上限に達しました。少し待って再試行してください。",
                503,
            ) from exc
        except APITimeoutError as exc:
            self._record_failure("PROVIDER_ERROR", exc)
            raise AIProviderError("AI_TIMEOUT", "AIの応答が時間内に完了しませんでした。", 504) from exc
        except APIConnectionError as exc:
            self._record_failure("PROVIDER_ERROR", exc)
            raise AIProviderError("AI_CONNECTION_ERROR", "AIサービスへ接続できませんでした。", 503) from exc
        except APIStatusError as exc:
            if exc.status_code in {403, 404}:
                self._record_failure("MODEL_ERROR", exc)
                code = "AI_MODEL_ACCESS_ERROR" if exc.status_code == 403 else "AI_MODEL_NOT_AVAILABLE"
                raise AIProviderError(code, "設定したAIモデルの利用権限またはモデル名を確認してください。", 503) from exc
            if exc.status_code == 400:
                self._record_failure("REQUEST_ERROR", exc)
                raise AIProviderError(
                    "AI_REQUEST_ERROR",
                    "AIリクエスト設定（モデル名・出力形式）を確認してください。",
                    502,
                ) from exc
            self._record_failure("PROVIDER_ERROR", exc)
            raise AIProviderError("AI_PROVIDER_ERROR", "AIサービスで問題が発生しました。", 503) from exc
        except AIProviderError:
            raise
        except Exception as exc:
            self._record_failure("PROVIDER_ERROR", exc)
            raise AIProviderError("AI_PROVIDER_ERROR", "AIサービスの応答を確認できませんでした。", 502) from exc

    def analyze_visual(self, context: dict, image_data_url: str) -> VisualReview:
        try:
            response = self.client.responses.parse(
                model=self.model,
                instructions=VISUAL_SYSTEM_INSTRUCTIONS,
                input=[{
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": json.dumps(context, ensure_ascii=False, separators=(",", ":")),
                        },
                        {"type": "input_image", "image_url": image_data_url, "detail": "low"},
                    ],
                }],
                text_format=VisualReview,
                store=False,
                max_output_tokens=min(self.max_output_tokens, 1200),
            )
            parsed = response.output_parsed
            if parsed is None:
                self._record_failure("PROVIDER_ERROR")
                raise AIProviderError("AI_INVALID_RESPONSE", "画像評価の形式を確認できませんでした。", 502)
            self._reason_code = "READY"
            return parsed
        except AuthenticationError as exc:
            self._record_failure("AUTH_ERROR", exc)
            raise AIProviderError("AI_AUTH_ERROR", "AI用APIキーを確認してください。", 503) from exc
        except RateLimitError as exc:
            if self._is_quota_error(exc):
                self._record_failure("QUOTA_EXCEEDED", exc)
                raise AIProviderError(
                    "AI_QUOTA_EXCEEDED",
                    "API利用枠または請求設定を確認してください。",
                    503,
                ) from exc
            self._record_failure("RATE_LIMITED", exc)
            raise AIProviderError(
                "AI_PROVIDER_RATE_LIMITED",
                "APIのリクエスト上限に達しました。少し待って再試行してください。",
                503,
            ) from exc
        except APITimeoutError as exc:
            self._record_failure("PROVIDER_ERROR", exc)
            raise AIProviderError("AI_TIMEOUT", "AIの応答が時間内に完了しませんでした。", 504) from exc
        except APIConnectionError as exc:
            self._record_failure("PROVIDER_ERROR", exc)
            raise AIProviderError("AI_CONNECTION_ERROR", "AIサービスへ接続できませんでした。", 503) from exc
        except APIStatusError as exc:
            if exc.status_code in {403, 404}:
                self._record_failure("MODEL_ERROR", exc)
                code = "AI_MODEL_ACCESS_ERROR" if exc.status_code == 403 else "AI_MODEL_NOT_AVAILABLE"
                raise AIProviderError(code, "設定したAIモデルの利用権限またはモデル名を確認してください。", 503) from exc
            if exc.status_code == 400:
                self._record_failure("REQUEST_ERROR", exc)
                raise AIProviderError(
                    "AI_REQUEST_ERROR",
                    "AIリクエスト設定（モデル名・画像入力・出力形式）を確認してください。",
                    502,
                ) from exc
            self._record_failure("PROVIDER_ERROR", exc)
            raise AIProviderError("AI_PROVIDER_ERROR", "AIサービスで問題が発生しました。", 503) from exc
        except AIProviderError:
            raise
        except Exception as exc:
            self._record_failure("PROVIDER_ERROR", exc)
            raise AIProviderError("AI_PROVIDER_ERROR", "AIサービスの画像評価を確認できませんでした。", 502) from exc
