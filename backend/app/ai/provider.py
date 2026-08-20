from __future__ import annotations

from typing import Protocol

from app.ai.schemas import AIStatus, ProviderSuggestionEnvelope, VisualReview


class AIProviderError(Exception):
    def __init__(self, code: str, message: str, status_code: int = 503):
        super().__init__(message)
        self.code = code
        self.safe_message = message
        self.status_code = status_code


class AIProvider(Protocol):
    def status(self) -> AIStatus: ...
    def generate(self, context: dict) -> ProviderSuggestionEnvelope: ...
    def analyze_visual(self, context: dict, image_data_url: str) -> VisualReview: ...


class DisabledAIProvider:
    def __init__(self, *, model: str, enabled: bool, configured: bool):
        self.model = model
        self.enabled = enabled
        self.configured = configured

    def status(self) -> AIStatus:
        reason = "KEY_MISSING" if self.enabled and not self.configured else "DISABLED"
        return AIStatus(
            enabled=self.enabled,
            configured=self.configured,
            available=False,
            verified=False,
            reason_code=reason,
            model=self.model,
        )

    def generate(self, context: dict) -> ProviderSuggestionEnvelope:
        status = self.status()
        message = "AI用のAPIキーが設定されていません。" if status.reason_code == "KEY_MISSING" else "AI PLAN Assistは無効です。"
        raise AIProviderError(f"AI_{status.reason_code}", message, 503)

    def analyze_visual(self, context: dict, image_data_url: str) -> VisualReview:
        del context, image_data_url
        status = self.status()
        message = "AI用のAPIキーが設定されていません。" if status.reason_code == "KEY_MISSING" else "AI PLAN Assistは無効です。"
        raise AIProviderError(f"AI_{status.reason_code}", message, 503)
