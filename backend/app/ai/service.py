from __future__ import annotations

import json
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone
from threading import Lock
from uuid import uuid4

from sqlalchemy import delete, or_, select
from sqlalchemy.orm import Session

from app.ai.policy import POLICY_PRINCIPLES, POLICY_VERSION
from app.ai.provider import AIProviderError
from app.ai.schemas import (
    AICandidateProductContext,
    AIContractContext,
    AIPlanContext,
    AIPlanItemContext,
    AIProductRef,
    AISuggestion,
    AISuggestionResponse,
    PreferenceProfile,
    PreferenceProfileInput,
    ProviderSuggestion,
)
from app.ai.scoring import assess, known_total, product_fact, simulate, snapshot_plan
from app.models import AISuggestionPreview, Coordinate, Product, UserPreferenceProfile
from app.services.plans import add_product, mark_keep, remove_product, replace_item


class SessionRateLimiter:
    def __init__(self, limit: int, window_seconds: int):
        self.limit = limit
        self.window_seconds = window_seconds
        self._requests: dict[str, deque[float]] = defaultdict(deque)
        self._lock = Lock()

    def check(self, session_id: str) -> None:
        with self._lock:
            now = time.monotonic()
            history = self._requests[session_id]
            while history and history[0] <= now - self.window_seconds:
                history.popleft()
            if len(history) >= self.limit:
                raise AIProviderError("AI_RATE_LIMITED", "短時間の利用上限に達しました。少し待って再試行してください。", 429)
            history.append(now)


def default_profile(plan: Coordinate) -> PreferenceProfileInput:
    needs = [need.need_code for need in plan.needs if need.need_code != "RENTAL"]
    housing = plan.housing_type if plan.housing_type in {"RENTAL", "OWNED", "OTHER"} else "OTHER"
    return PreferenceProfileInput(
        room_size=plan.size_band,
        housing_type=housing,
        budget_max=plan.budget_max,
        needs=needs,
        preferred_style=plan.style if plan.style in {"NATURAL", "CLEAR_COOL", "DANDY", "ELEGANT", "COZY", "COLORFUL"} else None,
        priority_focus="BALANCED",
        preserve_existing_furniture=any(item.source == "EXISTING_EXTERNAL" for item in plan.items),
    )


def get_profile(session: Session, session_id: str, plan: Coordinate) -> PreferenceProfile:
    row = session.get(UserPreferenceProfile, session_id)
    if not row:
        return PreferenceProfile(**default_profile(plan).model_dump(), source="PLAN_DEFAULT")
    return _profile_response(row)


def save_profile(session: Session, session_id: str, payload: PreferenceProfileInput) -> PreferenceProfile:
    row = session.get(UserPreferenceProfile, session_id)
    values = payload.model_dump()
    if row is None:
        row = UserPreferenceProfile(owner_session_id=session_id)
        session.add(row)
    row.room_size = values["room_size"]
    row.housing_type = values["housing_type"]
    row.budget_max = values["budget_max"]
    row.needs_json = json.dumps(values["needs"], ensure_ascii=False)
    row.preferred_style = values["preferred_style"]
    row.priority_focus = values["priority_focus"]
    row.preserve_existing_furniture = values["preserve_existing_furniture"]
    session.commit()
    session.refresh(row)
    return _profile_response(row)


def _profile_response(row: UserPreferenceProfile) -> PreferenceProfile:
    return PreferenceProfile(
        room_size=row.room_size,
        housing_type=row.housing_type,
        budget_max=row.budget_max,
        needs=json.loads(row.needs_json),
        preferred_style=row.preferred_style,
        priority_focus=row.priority_focus,
        preserve_existing_furniture=row.preserve_existing_furniture,
        source="SAVED_PROFILE",
    )


def fit_for_plan(session: Session, session_id: str, plan: Coordinate):
    profile = get_profile(session, session_id, plan)
    return assess(snapshot_plan(plan), PreferenceProfileInput.model_validate(profile.model_dump(exclude={"source"})))


def generate_suggestions(
    session: Session,
    session_id: str,
    plan: Coordinate,
    provider,
    limiter: SessionRateLimiter,
    profile_override: PreferenceProfileInput | None = None,
) -> AISuggestionResponse:
    provider_status = provider.status()
    if not provider_status.enabled:
        raise AIProviderError("AI_DISABLED", "AI PLAN Assistは無効です。", 503)
    if not provider_status.configured:
        raise AIProviderError("AI_KEY_MISSING", "AI用のAPIキーが設定されていません。", 503)
    if provider_status.reason_code == "AUTH_ERROR":
        raise AIProviderError("AI_AUTH_ERROR", "AI用APIキーを確認してください。", 503)
    limiter.check(session_id)
    if profile_override is not None:
        profile = save_profile(session, session_id, profile_override)
    else:
        profile = get_profile(session, session_id, plan)
        if profile.source == "PLAN_DEFAULT":
            profile = save_profile(session, session_id, PreferenceProfileInput.model_validate(profile.model_dump(exclude={"source"})))
    profile_input = PreferenceProfileInput.model_validate(profile.model_dump(exclude={"source"}))
    snapshot = snapshot_plan(plan)
    current_fit = assess(snapshot, profile_input)
    candidates = _candidate_pool(session, snapshot)
    envelope = provider.generate(_provider_context(snapshot, profile_input, current_fit, candidates))
    now = datetime.now(timezone.utc)
    session.execute(
        delete(AISuggestionPreview).where(
            or_(AISuggestionPreview.expires_at < now, AISuggestionPreview.applied_at.is_not(None))
        )
    )
    suggestions: list[AISuggestion] = []
    seen_strategies: set[str] = set()
    for raw in envelope.suggestions:
        if raw.strategy in seen_strategies:
            continue
        validated = _validate_provider_suggestion(raw, snapshot, candidates)
        proposed = candidates.get(validated.product_id) if validated.product_id else None
        after_snapshot = simulate(snapshot, validated.action, validated.target_item_id, proposed)
        after_fit = assess(after_snapshot, profile_input)
        _validate_effects(snapshot, after_snapshot, profile_input, current_fit, after_fit)
        before_price, _ = known_total(snapshot)
        after_price, _ = known_total(after_snapshot)
        target_fact = next((item for item in snapshot.items if item.item_id == validated.target_item_id), None)
        suggestion = AISuggestion(
            id=f"ai-preview-{uuid4()}",
            strategy=validated.strategy,
            action=validated.action,
            title=validated.title,
            rationale=validated.rationale,
            tradeoff=validated.tradeoff,
            target=_item_ref(target_fact) if target_fact and target_fact.product_id else None,
            proposed_product=_product_ref(proposed) if proposed else None,
            before_price=before_price,
            after_price=after_price,
            price_delta=after_price - before_price,
            before_fit=current_fit,
            after_fit=after_fit,
        )
        session.add(
            AISuggestionPreview(
                id=suggestion.id,
                owner_session_id=session_id,
                plan_id=plan.id,
                fingerprint=current_fit.fingerprint,
                suggestion_json=json.dumps(suggestion.model_dump(mode="json"), ensure_ascii=False),
                expires_at=now + timedelta(minutes=15),
            )
        )
        suggestions.append(suggestion)
        seen_strategies.add(raw.strategy)
    if not suggestions:
        raise AIProviderError("AI_INVALID_RESPONSE", "AIの提案を安全に検証できませんでした。", 502)
    session.commit()
    return AISuggestionResponse(
        policy_version=POLICY_VERSION,
        profile=profile,
        current_fit=current_fit,
        suggestions=suggestions,
    )


def apply_suggestion(session: Session, session_id: str, plan: Coordinate, suggestion_id: str):
    preview = session.get(AISuggestionPreview, suggestion_id)
    if not preview or preview.owner_session_id != session_id or preview.plan_id != plan.id:
        raise AIProviderError("AI_SUGGESTION_NOT_FOUND", "このAI提案は利用できません。", 404)
    expires_at = preview.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if preview.applied_at is not None or expires_at <= datetime.now(timezone.utc):
        raise AIProviderError("AI_SUGGESTION_EXPIRED", "このAI提案は期限切れです。もう一度提案を作成してください。", 409)
    profile = get_profile(session, session_id, plan)
    profile_input = PreferenceProfileInput.model_validate(profile.model_dump(exclude={"source"}))
    before = assess(snapshot_plan(plan), profile_input)
    if before.fingerprint != preview.fingerprint:
        raise AIProviderError("AI_STALE_PLAN", "PLANまたは希望条件が変わりました。提案を作り直してください。", 409)
    suggestion = AISuggestion.model_validate_json(preview.suggestion_json)
    target_id = suggestion.target.item_id if suggestion.target else None
    product_id = suggestion.proposed_product.product_id if suggestion.proposed_product else None
    if suggestion.action == "KEEP" and target_id is not None:
        updated = mark_keep(session, plan, target_id)
    elif suggestion.action == "REMOVE" and target_id is not None:
        updated = remove_product(session, plan, target_id)
    elif suggestion.action == "REPLACE" and target_id is not None and product_id:
        _require_ai_product(session, product_id)
        updated = replace_item(session, plan, target_id, product_id)
    elif suggestion.action == "ADD" and product_id and suggestion.proposed_product:
        product = _require_ai_product(session, product_id)
        updated = add_product(session, plan, product_id, product.default_role)
    else:
        raise AIProviderError("AI_INVALID_SUGGESTION", "AI提案の操作を確認できませんでした。", 422)
    after = assess(snapshot_plan(updated), profile_input)
    session.delete(preview)
    session.commit()
    return updated, suggestion, before, after


def _candidate_pool(session: Session, snapshot) -> dict[str, Product]:
    current_ids = {item.product_id for item in snapshot.items if item.product_id}
    products = session.scalars(
        select(Product).where(
            Product.id.like("NTR-%"),
            Product.provenance == "NITORI_OFFICIAL_SNAPSHOT",
            Product.id.not_in(current_ids),
        ).order_by(Product.default_role, Product.price_snapshot, Product.id).limit(18)
    ).all()
    return {product.id: product for product in products}


def _provider_context(snapshot, profile, current_fit, candidates: dict[str, Product]) -> dict:
    context = AIPlanContext(
        contract=AIContractContext(
            policy_version=POLICY_VERSION,
            allowed_strategies=["PREFERENCE_SAFE", "BALANCED", "DISCOVERY"],
            allowed_actions=["KEEP", "REPLACE", "ADD", "REMOVE"],
            principles=list(POLICY_PRINCIPLES),
        ),
        preference_profile=profile,
        current_fit=current_fit,
        current_items=[AIPlanItemContext.model_validate(item.__dict__) for item in snapshot.items],
        allowed_products=[
            AICandidateProductContext(
                product_id=product.id,
                name=product.name,
                role=product.default_role,
                category=product.category,
                price_snapshot=product.price_snapshot,
                price_observed_at=product.price_observed_at.isoformat(),
                style_hint=product.style_hint,
            )
            for product in candidates.values()
        ],
    )
    return context.model_dump(mode="json", exclude={"current_fit": {"fingerprint"}})


def _validate_effects(before_snapshot, after_snapshot, profile, before_fit, after_fit) -> None:
    before_total, before_unknown = known_total(before_snapshot)
    after_total, after_unknown = known_total(after_snapshot)
    if profile.budget_max and before_unknown == 0 and after_unknown == 0:
        # A suggestion may repair an already-over-budget PLAN, but may not make
        # the overage worse or move an in-budget PLAN beyond the user's limit.
        maximum_allowed = max(profile.budget_max, before_total)
        if after_total > maximum_allowed:
            raise AIProviderError("AI_INVALID_RESPONSE", "AI提案が希望条件を満たしませんでした。", 502)

    before_axes = {axis.code: axis.score for axis in before_fit.axes}
    after_axes = {axis.code: axis.score for axis in after_fit.axes}
    protected_axes = ["NEEDS"]
    if profile.preserve_existing_furniture:
        protected_axes.append("EXISTING_FURNITURE")
    if profile.priority_focus == "STYLE":
        protected_axes.append("STYLE")
    for code in protected_axes:
        before_score = before_axes[code]
        after_score = after_axes[code]
        if before_score is not None and after_score is not None and after_score < before_score:
            raise AIProviderError("AI_INVALID_RESPONSE", "AI提案が希望条件を満たしませんでした。", 502)


def _validate_provider_suggestion(raw: ProviderSuggestion, snapshot, candidates: dict[str, Product]) -> ProviderSuggestion:
    current = {item.item_id: item for item in snapshot.items if item.item_id is not None}
    target = current.get(raw.target_item_id)
    product = candidates.get(raw.product_id) if raw.product_id else None
    purchase_count = sum(1 for item in snapshot.items if item.product_id)
    if raw.action == "KEEP":
        valid = target is not None and target.product_id is not None and raw.product_id is None
    elif raw.action == "REMOVE":
        valid = target is not None and target.source != "EXISTING_EXTERNAL" and raw.product_id is None and purchase_count > 1
    elif raw.action == "REPLACE":
        valid = target is not None and target.source != "EXISTING_EXTERNAL" and product is not None and product.default_role == target.role
    else:
        valid = raw.target_item_id is None and product is not None
    if not valid:
        raise AIProviderError("AI_INVALID_RESPONSE", "AIの提案が許可された商品操作の範囲外でした。", 502)
    return raw


def _require_ai_product(session: Session, product_id: str) -> Product:
    product = session.get(Product, product_id)
    if not product or not product.id.startswith("NTR-") or product.provenance != "NITORI_OFFICIAL_SNAPSHOT":
        raise AIProviderError("AI_PRODUCT_NOT_ALLOWED", "AI提案の商品候補を確認できませんでした。", 422)
    return product


def _item_ref(item) -> AIProductRef:
    return AIProductRef(
        item_id=item.item_id,
        product_id=item.product_id,
        name=item.name,
        role=item.role,
        price_snapshot=item.price,
    )


def _product_ref(product: Product) -> AIProductRef:
    fact = product_fact(product)
    return AIProductRef(
        product_id=product.id,
        name=product.name,
        role=fact.role,
        price_snapshot=product.price_snapshot,
    )
