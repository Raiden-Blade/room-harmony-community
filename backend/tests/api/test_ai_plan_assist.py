from __future__ import annotations

import base64
import sqlite3
from io import BytesIO
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.ai.provider import AIProviderError
from app.ai.schemas import (
    AIStatus,
    ProviderSuggestion,
    ProviderSuggestionEnvelope,
    VisualLayoutChange,
    VisualObservation,
    VisualReview,
)
from app.core.config import REPOSITORY_DIR, Settings
from app.main import create_app


class FakeProvider:
    def __init__(self, mode: str = "replace"):
        self.mode = mode
        self.last_context: dict | None = None
        self.last_visual_context: dict | None = None

    def status(self):
        return AIStatus(enabled=True, configured=True, available=True, verified=True, reason_code="READY", model="fake-model")

    def generate(self, context: dict):
        self.last_context = context
        if self.mode == "error":
            raise AIProviderError("AI_AUTH_ERROR", "AI用APIキーを確認してください。", 503)
        if self.mode == "busy":
            raise AIProviderError("AI_PROVIDER_RATE_LIMITED", "APIのリクエスト上限に達しました。少し待って再試行してください。", 503)
        if self.mode == "timeout":
            raise AIProviderError("AI_TIMEOUT", "AIの応答が時間内に完了しませんでした。", 504)
        current = context["current_items"]
        if self.mode in {"category-match", "category-mismatch"}:
            target = next(item for item in current if item["category"] == "DESK")
            expected_category = "DESK" if self.mode == "category-match" else "SUPPORT"
            candidate = next(item for item in context["allowed_products"] if (
                item["category"] == expected_category and item["role"] == target["role"]
            ))
            return ProviderSuggestionEnvelope(suggestions=[ProviderSuggestion(
                strategy="BALANCED", action="REPLACE", target_item_id=target["item_id"],
                product_id=candidate["product_id"], title="作業家具を調整",
                rationale="構造化された商品候補を比較します。", tradeoff="現在の商品はPLANから外れます。",
            )])
        if self.mode == "partial":
            targets = [item for item in current if item["product_id"]][:2]
            candidate = max(context["allowed_products"], key=lambda item: item["price_snapshot"] or 0)
            return ProviderSuggestionEnvelope(suggestions=[
                ProviderSuggestion(
                    strategy="PREFERENCE_SAFE", action="KEEP", target_item_id=targets[0]["item_id"],
                    product_id=None, title="主商品を維持", rationale="現在の商品を維持します。",
                    tradeoff="商品構成は変わりません。",
                ),
                ProviderSuggestion(
                    strategy="BALANCED", action="ADD", target_item_id=None,
                    product_id=candidate["product_id"], title="予算を超える追加",
                    rationale="候補商品を追加します。", tradeoff="予算条件に適合しません。",
                ),
                ProviderSuggestion(
                    strategy="DISCOVERY", action="KEEP", target_item_id=targets[1]["item_id"],
                    product_id=None, title="収納商品を維持", rationale="現在の商品を維持します。",
                    tradeoff="商品構成は変わりません。",
                ),
            ])
        if self.mode == "all-invalid":
            target = next(item for item in current if item["product_id"])
            return ProviderSuggestionEnvelope(suggestions=[
                ProviderSuggestion(
                    strategy="PREFERENCE_SAFE", action="ADD", target_item_id=None,
                    product_id="NTR-NOT-ALLOWED-A", title="候補外追加",
                    rationale="候補外の商品です。", tradeoff="サーバーで拒否されます。",
                ),
                ProviderSuggestion(
                    strategy="BALANCED", action="REPLACE", target_item_id=target["item_id"],
                    product_id="NTR-NOT-ALLOWED-B", title="候補外置換",
                    rationale="候補外の商品です。", tradeoff="サーバーで拒否されます。",
                ),
                ProviderSuggestion(
                    strategy="DISCOVERY", action="REMOVE", target_item_id=None,
                    product_id=None, title="対象なし削除",
                    rationale="対象商品がありません。", tradeoff="サーバーで拒否されます。",
                ),
            ])
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

    def analyze_visual(self, context: dict, image_data_url: str):
        assert image_data_url.startswith("data:image/jpeg;base64,")
        self.last_visual_context = context
        first = context["items"][0]
        return VisualReview(
            summary="中央の商品群に視線が集まり、左右の余白には差があります。",
            observations=[
                VisualObservation(
                    code="VISUAL_BALANCE", label="視覚的な重心",
                    observation="主家具が中央寄りにまとまっています。",
                    evidence="主家具と収納が画面中央から左側に集中しています。",
                    suggestion="収納を少し左へ動かし、主家具との間隔を試してください。",
                    confidence="HIGH",
                ),
                VisualObservation(
                    code="STYLE_COHERENCE", label="スタイルのまとまり",
                    observation="明るい木目の印象が共通しています。",
                    evidence="画像内の商品タイルに近い明度が繰り返されています。",
                    suggestion="アクセントを一箇所に絞って比較してください。",
                    confidence="MEDIUM",
                ),
            ],
            next_action="収納を左へ少し移動し、左右の余白を見比べてください。",
            layout_changes=[VisualLayoutChange(
                item_id=first["item_id"], x=1, y=0, scale=1.25, rotation=180,
                reason="主家具から少し距離を取り、左右の重心を比較するためです。",
            )],
        )


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


def _plan(client: TestClient, coordinate_id: str = "coord-001", budget_max: int = 50_000) -> dict:
    response = client.post(f"/api/plans/from-coordinate/{coordinate_id}", json={"budget_max": budget_max})
    assert response.status_code == 201
    return response.json()


def _neutral_profile(budget_max: int = 100_000) -> dict:
    return {
        "room_size": "SMALL_6", "housing_type": "RENTAL", "budget_max": budget_max,
        "needs": [], "preferred_style": None, "priority_focus": "BALANCED",
        "preserve_existing_furniture": False,
    }


def _visual_payload(plan: dict) -> dict:
    buffer = BytesIO()
    Image.new("RGB", (760, 480), color=(238, 241, 236)).save(buffer, format="JPEG")
    image_data_url = "data:image/jpeg;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")
    product_items = [item for item in plan["items"] if item["product"]]
    return {
        "image_data_url": image_data_url,
        "layout_items": [
            {
                "item_id": item["id"], "product_id": item["product"]["id"],
                "x": 0.2 + index * 0.1, "y": 0.55, "scale": 1,
                "rotation": 0, "visible": True,
            }
            for index, item in enumerate(product_items)
        ],
    }


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
    visual = client.post(f"/api/plans/{plan['id']}/ai/visual-review", json=_visual_payload(plan))
    assert visual.status_code == 503
    assert visual.json()["detail"]["code"] == "AI_DISABLED"


def test_visual_review_uses_exact_current_plan_items_and_returns_bounded_feedback(tmp_path):
    provider = FakeProvider()
    with _client(tmp_path, provider) as client:
        client.headers["X-Session-ID"] = "visual-review-session"
        plan = _plan(client)
        payload = _visual_payload(plan)
        response = client.post(f"/api/plans/{plan['id']}/ai/visual-review", json=payload)

    assert response.status_code == 200
    body = response.json()
    assert body["image_used"] is True
    assert body["policy_version"].endswith("-visual-1")
    assert len(body["observations"]) == 2
    assert len(body["layout_changes"]) == 1
    original = payload["layout_items"][0]
    change = body["layout_changes"][0]
    assert change["item_id"] == original["item_id"]
    assert abs(change["x"] - original["x"]) <= 0.181
    assert abs(change["y"] - original["y"]) <= 0.181
    assert abs(change["rotation"] - original["rotation"]) <= 30
    assert "実寸" in body["disclaimer"]
    assert provider.last_visual_context is not None
    assert {item["product_id"] for item in provider.last_visual_context["items"]} == {
        item["product"]["id"] for item in plan["items"] if item["product"]
    }
    assert provider.last_visual_context["rendering_limits"]


def test_visual_review_rejects_stale_product_mapping_before_provider_call(tmp_path):
    provider = FakeProvider()
    with _client(tmp_path, provider) as client:
        client.headers["X-Session-ID"] = "visual-stale-session"
        plan = _plan(client)
        payload = _visual_payload(plan)
        payload["layout_items"][0]["product_id"] = "NTR-NOT-IN-CURRENT-PLAN"
        response = client.post(f"/api/plans/{plan['id']}/ai/visual-review", json=payload)

    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "AI_STALE_PLAN"
    assert provider.last_visual_context is None


def test_visual_review_rejects_invalid_image_before_provider_call(tmp_path):
    provider = FakeProvider()
    with _client(tmp_path, provider) as client:
        client.headers["X-Session-ID"] = "visual-invalid-image-session"
        plan = _plan(client)
        payload = _visual_payload(plan)
        payload["image_data_url"] = "data:image/jpeg;base64," + base64.b64encode(b"not-an-image").decode("ascii")
        response = client.post(f"/api/plans/{plan['id']}/ai/visual-review", json=payload)

    assert response.status_code == 422
    assert response.json()["detail"]["code"] == "AI_INVALID_IMAGE"
    assert provider.last_visual_context is None


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


def test_replace_rejects_desk_to_support_even_when_role_matches(tmp_path):
    with _client(tmp_path, FakeProvider("category-mismatch")) as client:
        client.headers["X-Session-ID"] = "category-mismatch-session"
        plan = _plan(client, "coord-015", 100_000)
        response = client.post(
            f"/api/plans/{plan['id']}/ai/suggestions", json={"profile": _neutral_profile()}
        )

        assert response.status_code == 502
        assert response.json()["detail"]["code"] == "AI_INVALID_RESPONSE"


def test_replace_allows_desk_to_another_desk(tmp_path):
    with _client(tmp_path, FakeProvider("category-match")) as client:
        client.headers["X-Session-ID"] = "category-match-session"
        plan = _plan(client, "coord-015", 100_000)
        response = client.post(
            f"/api/plans/{plan['id']}/ai/suggestions", json={"profile": _neutral_profile()}
        )

        assert response.status_code == 200
        suggestion = response.json()["suggestions"][0]
        assert suggestion["action"] == "REPLACE"
        assert suggestion["target"]["product_id"] == "NTR-6201526"
        assert suggestion["proposed_product"]["product_id"] in {"NTR-5637001", "NTR-2110700072028"}


def test_partial_provider_response_keeps_valid_suggestions_only(tmp_path):
    database = tmp_path / "ai-test.db"
    with _client(tmp_path, FakeProvider("partial")) as client:
        client.headers["X-Session-ID"] = "partial-response-session"
        plan = _plan(client)
        before = client.get(f"/api/plans/{plan['id']}").json()
        profile = {
            "room_size": "SMALL_6", "housing_type": "RENTAL", "budget_max": 27_000,
            "needs": ["STORAGE"], "preferred_style": "NATURAL", "priority_focus": "BUDGET",
            "preserve_existing_furniture": True,
        }
        response = client.post(f"/api/plans/{plan['id']}/ai/suggestions", json={"profile": profile})
        after = client.get(f"/api/plans/{plan['id']}").json()

        assert response.status_code == 200
        assert [item["strategy"] for item in response.json()["suggestions"]] == ["PREFERENCE_SAFE", "DISCOVERY"]
        assert [item["action"] for item in response.json()["suggestions"]] == ["KEEP", "KEEP"]
        assert after["items"] == before["items"]

    with sqlite3.connect(database) as connection:
        rows = connection.execute("SELECT suggestion_json FROM ai_suggestion_previews").fetchall()
    assert len(rows) == 2
    assert all("予算を超える追加" not in row[0] for row in rows)


def test_all_invalid_provider_suggestions_return_controlled_error_without_preview(tmp_path):
    database = tmp_path / "ai-test.db"
    with _client(tmp_path, FakeProvider("all-invalid")) as client:
        client.headers["X-Session-ID"] = "all-invalid-response-session"
        plan = _plan(client)
        before = client.get(f"/api/plans/{plan['id']}").json()
        response = client.post(f"/api/plans/{plan['id']}/ai/suggestions", json={"profile": None})
        after = client.get(f"/api/plans/{plan['id']}").json()

        assert response.status_code == 502
        assert response.json()["detail"] == {
            "code": "AI_INVALID_RESPONSE", "message": "AIの提案を安全に検証できませんでした。",
        }
        assert "NTR-NOT-ALLOWED" not in response.text
        assert after["items"] == before["items"]

    with sqlite3.connect(database) as connection:
        count = connection.execute("SELECT COUNT(*) FROM ai_suggestion_previews").fetchone()[0]
    assert count == 0


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
    [("busy", 503, "AI_PROVIDER_RATE_LIMITED"), ("timeout", 504, "AI_TIMEOUT")],
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


def test_settings_accept_runtime_openai_compatible_endpoint(monkeypatch):
    monkeypatch.setenv("RHC_OPENAI_BASE_URL", "https://example.invalid/v1")
    monkeypatch.setenv("RHC_OPENAI_MODEL", "gpt-4o-mini")

    settings = Settings(_env_file=None)

    assert settings.openai_base_url == "https://example.invalid/v1"
    assert settings.openai_model == "gpt-4o-mini"


def test_app_wires_openai_compatible_endpoint_to_provider(tmp_path):
    with _client(
        tmp_path,
        ai_enabled=True,
        openai_api_key="sentinel-fake-secret-never-use",
        openai_base_url="https://example.invalid/v1",
        openai_model="gpt-4o-mini",
    ) as client:
        provider = client.app.state.ai_provider

        assert str(provider.client.base_url) == "https://example.invalid/v1/"
        assert provider.status().model == "gpt-4o-mini"


def test_ai_status_never_returns_configured_secret(tmp_path):
    sentinel = "sentinel-fake-secret-never-use"
    with _client(tmp_path, ai_enabled=True, openai_api_key=sentinel) as client:
        response = client.get("/api/ai/status")
        assert response.status_code == 200
        assert response.json()["reason_code"] == "NOT_CHECKED"
        assert response.json()["verified"] is False
        assert response.json()["available"] is True
        assert sentinel not in response.text
