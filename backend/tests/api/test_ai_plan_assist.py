from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.ai.provider import AIProviderError
from app.ai.schemas import AIStatus, ProviderSuggestion, ProviderSuggestionEnvelope
from app.core.config import REPOSITORY_DIR, Settings
from app.main import create_app


class FakeProvider:
    def __init__(self, mode: str = "replace"):
        self.mode = mode
        self.last_context: dict | None = None

    def status(self):
        return AIStatus(enabled=True, configured=True, available=True, reason_code="READY", model="fake-model")

    def generate(self, context: dict):
        self.last_context = context
        if self.mode == "error":
            raise AIProviderError("AI_AUTH_ERROR", "AI用APIキーを確認してください。", 503)
        if self.mode == "busy":
            raise AIProviderError("AI_PROVIDER_BUSY", "AIが混み合っています。少し待って再試行してください。", 503)
        if self.mode == "timeout":
            raise AIProviderError("AI_TIMEOUT", "AIの応答が時間内に完了しませんでした。", 504)
        current = context["current_items"]
        if self.mode == "unknown":
            return ProviderSuggestionEnvelope(suggestions=[ProviderSuggestion(
                strategy="BALANCED", action="ADD", target_item_id=None, product_id="NTR-NOT-ALLOWED",
                title="不正候補", rationale="候補外ID", tradeoff="検証で拒否されます",
            )])
        if self.mode == "budget-worsen":
            candidate = max(context["allowed_products"], key=lambda item: item["price_snapshot"])
            return ProviderSuggestionEnvelope(suggestions=[ProviderSuggestion(
                strategy="DISCOVERY", action="ADD", target_item_id=None, product_id=candidate["product_id"],
                title="予算を超える追加", rationale="候補を追加します。", tradeoff="予算を超えます。",
            )])
        target = next(item for item in current if item["product_id"])
        candidate = next(item for item in context["allowed_products"] if (
            item["role"] != target["role"] if self.mode == "role-mismatch" else item["role"] == target["role"]
        ))
        return ProviderSuggestionEnvelope(suggestions=[ProviderSuggestion(
            strategy="BALANCED", action="REPLACE", target_item_id=target["item_id"], product_id=candidate["product_id"],
            title="予算と希望を再調整", rationale="同じ役割の公式候補へ1点だけ置き換えます。", tradeoff="現在の商品はPLANから外れます。",
        )])


def _client(tmp_path: Path, provider=None, **overrides):
    ai_enabled = overrides.pop("ai_enabled", provider is not None)
    settings = Settings(
        database_url=f"sqlite:///{(tmp_path / 'ai-test.db').as_posix()}",
        seed_path=REPOSITORY_DIR / "data" / "seed" / "demo_seed.json",
        seasonal_seed_path=REPOSITORY_DIR / "data" / "seed" / "seasonal_seed.json",
        upload_dir=tmp_path / "uploads",
        cors_origins=["http://testserver"],
        ai_enabled=ai_enabled,
        **overrides,
    )
    return TestClient(create_app(settings, ai_provider=provider))


def _plan(client: TestClient) -> dict:
    response = client.post("/api/plans/from-coordinate/coord-001", json={"budget_max": 50_000})
    assert response.status_code == 201
    return response.json()


def test_phase_one_remains_available_without_a_key_and_fit_is_deterministic(client):
    plan = _plan(client)
    status = client.get("/api/ai/status")
    assert status.json()["reason_code"] == "DISABLED"
    first = client.get(f"/api/plans/{plan['id']}/fit")
    second = client.get(f"/api/plans/{plan['id']}/fit")
    assert first.status_code == 200
    assert first.json()["overall_score"] == second.json()["overall_score"]
    assert [axis["code"] for axis in first.json()["axes"]] == [
        "BUDGET", "NEEDS", "EXISTING_FURNITURE", "STYLE", "COMPOSITION"
    ]
    disabled = client.post(f"/api/plans/{plan['id']}/ai/suggestions", json={"profile": None})
    assert disabled.status_code == 503
    assert disabled.json()["detail"]["code"] == "AI_DISABLED"


def test_profile_is_private_per_anonymous_session(client):
    plan = _plan(client)
    payload = {
        "room_size": "SMALL_6", "housing_type": "RENTAL", "budget_max": 42_000,
        "needs": ["STORAGE", "COMPACT"], "preferred_style": "NATURAL",
        "priority_focus": "BUDGET", "preserve_existing_furniture": True,
    }
    saved = client.put("/api/ai/profile", json=payload)
    assert saved.status_code == 200
    assert saved.json()["priority_focus"] == "BUDGET"
    response = client.get(f"/api/ai/profile?plan_id={plan['id']}", headers={"X-Session-ID": "other-session"})
    assert response.status_code == 404


def test_profile_can_be_created_read_and_updated_for_the_owner(client):
    client.headers["X-Session-ID"] = "profile-owner"
    plan = _plan(client)
    payload = {
        "room_size": "SMALL_6", "housing_type": "RENTAL", "budget_max": 42_000,
        "needs": ["STORAGE", "COMPACT"], "preferred_style": "NATURAL",
        "priority_focus": "BUDGET", "preserve_existing_furniture": True,
    }

    assert client.put("/api/ai/profile", json=payload).status_code == 200
    loaded = client.get(f"/api/ai/profile?plan_id={plan['id']}")
    assert loaded.status_code == 200
    assert loaded.json()["source"] == "SAVED_PROFILE"
    assert loaded.json()["budget_max"] == 42_000

    payload["budget_max"] = 36_000
    payload["priority_focus"] = "NEEDS"
    updated = client.put("/api/ai/profile", json=payload)
    assert updated.json()["budget_max"] == 36_000
    assert updated.json()["priority_focus"] == "NEEDS"


def test_reset_database_removes_saved_preference_profile(tmp_path):
    database = tmp_path / "ai-test.db"
    with _client(tmp_path) as client:
        client.headers["X-Session-ID"] = "reset-owner"
        _plan(client)
        saved = client.put("/api/ai/profile", json={
            "room_size": "SMALL_6", "housing_type": "RENTAL", "budget_max": 12_000,
            "needs": ["LOW_BUDGET"], "preferred_style": None, "priority_focus": "BUDGET",
            "preserve_existing_furniture": False,
        })
        assert saved.json()["source"] == "SAVED_PROFILE"
    assert database.exists()
    database.unlink()

    with _client(tmp_path) as client:
        client.headers["X-Session-ID"] = "reset-owner"
        plan = _plan(client)
        profile = client.get(f"/api/ai/profile?plan_id={plan['id']}").json()
        assert profile["source"] == "PLAN_DEFAULT"
        assert profile["budget_max"] != 12_000


def test_provider_suggestion_requires_human_apply_and_uses_shared_mutation(tmp_path):
    with _client(tmp_path, FakeProvider()) as client:
        client.headers["X-Session-ID"] = "ai-session"
        plan = _plan(client)
        before_ids = [item["product"]["id"] for item in plan["items"] if item["product"]]
        suggested = client.post(f"/api/plans/{plan['id']}/ai/suggestions", json={"profile": None})
        assert suggested.status_code == 200
        suggestion = suggested.json()["suggestions"][0]
        unchanged = client.get(f"/api/plans/{plan['id']}").json()
        assert [item["product"]["id"] for item in unchanged["items"] if item["product"]] == before_ids
        applied = client.post(f"/api/plans/{plan['id']}/ai/apply", json={"suggestion_id": suggestion["id"]})
        assert applied.status_code == 200
        assert any(item["mutation_state"] == "REPLACED" for item in applied.json()["plan"]["items"])
        assert applied.json()["plan"]["price"]["known_total"] == suggestion["after_price"]
        assert applied.json()["before_fit"]["fingerprint"] != applied.json()["after_fit"]["fingerprint"]


def test_candidate_pool_is_curated_and_excludes_current_plan_products(tmp_path):
    provider = FakeProvider()
    with _client(tmp_path, provider) as client:
        client.headers["X-Session-ID"] = "candidate-session"
        plan = _plan(client)
        current_ids = {item["product"]["id"] for item in plan["items"] if item["product"]}
        response = client.post(f"/api/plans/{plan['id']}/ai/suggestions", json={"profile": None})
        assert response.status_code == 200

    assert provider.last_context is not None
    allowed_ids = {item["product_id"] for item in provider.last_context["allowed_products"]}
    assert allowed_ids
    assert all(product_id.startswith("NTR-") for product_id in allowed_ids)
    assert allowed_ids.isdisjoint(current_ids)
    assert len(allowed_ids) <= 18


def test_stale_plan_rejects_apply(tmp_path):
    with _client(tmp_path, FakeProvider()) as client:
        client.headers["X-Session-ID"] = "stale-session"
        plan = _plan(client)
        suggestion = client.post(f"/api/plans/{plan['id']}/ai/suggestions", json={"profile": None}).json()["suggestions"][0]
        client.put("/api/ai/profile", json={
            "room_size": "SMALL_6", "housing_type": "RENTAL", "budget_max": 30_000,
            "needs": ["STORAGE"], "preferred_style": "NATURAL", "priority_focus": "BUDGET",
            "preserve_existing_furniture": False,
        })
        applied = client.post(f"/api/plans/{plan['id']}/ai/apply", json={"suggestion_id": suggestion["id"]})
        assert applied.status_code == 409
        assert applied.json()["detail"]["code"] == "AI_STALE_PLAN"


def test_unknown_product_is_rejected_without_leaking_provider_details(tmp_path):
    with _client(tmp_path, FakeProvider("unknown")) as client:
        client.headers["X-Session-ID"] = "invalid-session"
        plan = _plan(client)
        response = client.post(f"/api/plans/{plan['id']}/ai/suggestions", json={"profile": None})
        assert response.status_code == 502
        assert response.json()["detail"]["code"] == "AI_INVALID_RESPONSE"
        assert "NTR-NOT-ALLOWED" not in response.text


def test_replace_role_mismatch_is_rejected_by_server_policy(tmp_path):
    with _client(tmp_path, FakeProvider("role-mismatch")) as client:
        client.headers["X-Session-ID"] = "role-session"
        plan = _plan(client)
        response = client.post(f"/api/plans/{plan['id']}/ai/suggestions", json={"profile": None})
        assert response.status_code == 502
        assert response.json()["detail"]["code"] == "AI_INVALID_RESPONSE"


def test_server_rejects_suggestion_that_worsens_hard_budget_constraint(tmp_path):
    with _client(tmp_path, FakeProvider("budget-worsen")) as client:
        client.headers["X-Session-ID"] = "budget-safety-session"
        plan = _plan(client)
        client.put("/api/ai/profile", json={
            "room_size": "SMALL_6", "housing_type": "RENTAL", "budget_max": 27_000,
            "needs": ["STORAGE"], "preferred_style": "NATURAL", "priority_focus": "BUDGET",
            "preserve_existing_furniture": True,
        })
        response = client.post(f"/api/plans/{plan['id']}/ai/suggestions", json={"profile": None})
        assert response.status_code == 502
        assert response.json()["detail"]["code"] == "AI_INVALID_RESPONSE"


def test_local_rate_limit_and_safe_provider_error(tmp_path):
    with _client(tmp_path, FakeProvider(), ai_rate_limit_requests=1) as client:
        client.headers["X-Session-ID"] = "rate-session"
        plan = _plan(client)
        assert client.post(f"/api/plans/{plan['id']}/ai/suggestions", json={"profile": None}).status_code == 200
        limited = client.post(f"/api/plans/{plan['id']}/ai/suggestions", json={"profile": None})
        assert limited.status_code == 429
        assert limited.json()["detail"]["code"] == "AI_RATE_LIMITED"
    with _client(tmp_path / "provider", FakeProvider("error")) as client:
        client.headers["X-Session-ID"] = "provider-session"
        plan = _plan(client)
        failed = client.post(f"/api/plans/{plan['id']}/ai/suggestions", json={"profile": None})
        assert failed.status_code == 503
        assert failed.json()["detail"] == {"code": "AI_AUTH_ERROR", "message": "AI用APIキーを確認してください。"}


@pytest.mark.parametrize(
    ("mode", "status_code", "code"),
    [("busy", 503, "AI_PROVIDER_BUSY"), ("timeout", 504, "AI_TIMEOUT")],
)
def test_provider_busy_and_timeout_are_mapped_to_controlled_errors(tmp_path, mode, status_code, code):
    with _client(tmp_path / mode, FakeProvider(mode)) as client:
        client.headers["X-Session-ID"] = f"{mode}-session"
        plan = _plan(client)
        response = client.post(f"/api/plans/{plan['id']}/ai/suggestions", json={"profile": None})
        assert response.status_code == status_code
        assert response.json()["detail"]["code"] == code
        assert "traceback" not in response.text.lower()


def test_settings_do_not_read_unprefixed_machine_key(monkeypatch):
    sentinel = "sentinel-fake-secret-never-use"
    monkeypatch.setenv("OPENAI_API_KEY", sentinel)
    settings = Settings(_env_file=None)
    assert settings.openai_api_key is None
    assert sentinel not in repr(settings)


def test_ai_status_never_returns_configured_secret(tmp_path):
    sentinel = "sentinel-fake-secret-never-use"
    with _client(tmp_path, ai_enabled=True, openai_api_key=sentinel) as client:
        response = client.get("/api/ai/status")
        assert response.status_code == 200
        assert response.json()["reason_code"] == "READY"
        assert sentinel not in response.text
