from __future__ import annotations

import json

from openai import APIConnectionError, APIStatusError, APITimeoutError, AuthenticationError, OpenAI, RateLimitError

from app.ai.policy import SYSTEM_INSTRUCTIONS
from app.ai.provider import AIProviderError
from app.ai.schemas import AIStatus, ProviderSuggestionEnvelope


class OpenAIPlanProvider:
    def __init__(self, *, api_key: str, model: str, timeout: float, max_retries: int, max_output_tokens: int):
        self.model = model
        self.max_output_tokens = max_output_tokens
        self._reason_code = "READY"
        self.client = OpenAI(api_key=api_key, timeout=timeout, max_retries=max_retries)

    def status(self) -> AIStatus:
        return AIStatus(
            enabled=True,
            configured=True,
            available=self._reason_code == "READY",
            reason_code=self._reason_code,
            model=self.model,
        )

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
                raise AIProviderError("AI_INVALID_RESPONSE", "AIの提案形式を確認できませんでした。", 502)
            self._reason_code = "READY"
            return parsed
        except AuthenticationError as exc:
            self._reason_code = "AUTH_ERROR"
            raise AIProviderError("AI_AUTH_ERROR", "AI用APIキーを確認してください。", 503) from exc
        except RateLimitError as exc:
            raise AIProviderError("AI_PROVIDER_BUSY", "AIが混み合っています。少し待って再試行してください。", 503) from exc
        except APITimeoutError as exc:
            raise AIProviderError("AI_TIMEOUT", "AIの応答が時間内に完了しませんでした。", 504) from exc
        except APIConnectionError as exc:
            self._reason_code = "PROVIDER_ERROR"
            raise AIProviderError("AI_CONNECTION_ERROR", "AIサービスへ接続できませんでした。", 503) from exc
        except APIStatusError as exc:
            self._reason_code = "PROVIDER_ERROR"
            raise AIProviderError("AI_PROVIDER_ERROR", "AIサービスで問題が発生しました。", 503) from exc
        except AIProviderError:
            raise
        except Exception as exc:
            self._reason_code = "PROVIDER_ERROR"
            raise AIProviderError("AI_PROVIDER_ERROR", "AIサービスの応答を確認できませんでした。", 502) from exc
