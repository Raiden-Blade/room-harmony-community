from __future__ import annotations

import hashlib
import json
from collections import Counter
from dataclasses import asdict, dataclass, replace

from app.ai.policy import POLICY_VERSION
from app.ai.schemas import FitAssessment, FitAxis, PreferenceProfileInput
from app.models import Coordinate, Product


VERIFIED_STYLES = {"NATURAL", "CLEAR_COOL", "DANDY"}
WEIGHTS = {
    "BALANCED": {"BUDGET": 25, "NEEDS": 30, "EXISTING_FURNITURE": 15, "STYLE": 15, "COMPOSITION": 15},
    "BUDGET": {"BUDGET": 40, "NEEDS": 25, "EXISTING_FURNITURE": 10, "STYLE": 10, "COMPOSITION": 15},
    "NEEDS": {"BUDGET": 20, "NEEDS": 45, "EXISTING_FURNITURE": 10, "STYLE": 10, "COMPOSITION": 15},
    "EXISTING_FURNITURE": {"BUDGET": 20, "NEEDS": 25, "EXISTING_FURNITURE": 30, "STYLE": 10, "COMPOSITION": 15},
    "STYLE": {"BUDGET": 20, "NEEDS": 25, "EXISTING_FURNITURE": 10, "STYLE": 30, "COMPOSITION": 15},
}
NEED_TEMPLATES = {
    "STORAGE": ["BED", "STORAGE", "STORAGE", "LIGHTING", "TEXTILE"],
    "LOW_BUDGET": ["BED", "STORAGE", "LIGHTING"],
    "WORK_FROM_HOME": ["BED", "DESK", "SUPPORT", "LIGHTING", "STORAGE"],
    "RELAX": ["BED", "SUPPORT", "SUPPORT", "LIGHTING", "TEXTILE"],
    "SLEEP": ["BED", "TEXTILE", "LIGHTING", "STORAGE"],
    "COMPACT": ["BED", "DESK", "STORAGE", "SUPPORT"],
}
AXIS_LABELS = {
    "BUDGET": "予算",
    "NEEDS": "困りごと",
    "EXISTING_FURNITURE": "手持ち家具",
    "STYLE": "テイスト",
    "COMPOSITION": "構成",
}
EXISTING_FURNITURE_CATEGORY_BY_ROLE = {
    "MAIN_FURNITURE": "BED",
    "STORAGE": "STORAGE",
    "LIGHTING": "LIGHTING",
    "TEXTILE": "TEXTILE",
}


@dataclass(frozen=True)
class ItemFact:
    item_id: int | None
    product_id: str | None
    name: str
    role: str
    category: str
    source: str
    mutation_state: str
    quantity: int
    price: int | None
    provenance: str | None
    style_hint: str | None
    price_observed_at: str | None = None


@dataclass(frozen=True)
class PlanSnapshot:
    plan_id: str
    items: tuple[ItemFact, ...]


def snapshot_plan(plan: Coordinate) -> PlanSnapshot:
    return PlanSnapshot(
        plan_id=plan.id,
        items=tuple(
            ItemFact(
                item_id=item.id,
                product_id=item.product_id,
                # Existing-furniture labels are user-authored free text and are
                # not needed by the provider. Keep only the structured role.
                name=item.product.name if item.product else "手持ち家具",
                role=item.role,
                category=item.product.category if item.product else _role_category(item.role),
                source=item.source,
                mutation_state=item.mutation_state,
                quantity=item.quantity,
                price=item.price_snapshot,
                provenance=item.product.provenance if item.product else None,
                style_hint=item.product.style_hint if item.product else None,
                price_observed_at=item.price_observed_at.isoformat() if item.price_observed_at else None,
            )
            for item in plan.items
        ),
    )


def product_fact(product: Product, *, item_id: int | None = None) -> ItemFact:
    return ItemFact(
        item_id=item_id,
        product_id=product.id,
        name=product.name,
        role=product.default_role,
        category=product.category,
        source="CATALOG_TO_BUY",
        mutation_state="SIMULATED",
        quantity=1,
        price=product.price_snapshot,
        provenance=product.provenance,
        style_hint=product.style_hint,
        price_observed_at=product.price_observed_at.isoformat(),
    )


def simulate(snapshot: PlanSnapshot, action: str, target_item_id: int | None, product: Product | None) -> PlanSnapshot:
    items = list(snapshot.items)
    if action == "KEEP":
        return snapshot
    if action == "REMOVE":
        items = [item for item in items if item.item_id != target_item_id]
    elif action == "REPLACE" and product:
        items = [
            replace(product_fact(product, item_id=item.item_id), quantity=item.quantity)
            if item.item_id == target_item_id else item
            for item in items
        ]
    elif action == "ADD" and product:
        items.append(product_fact(product))
    return replace(snapshot, items=tuple(items))


def known_total(snapshot: PlanSnapshot) -> tuple[int, int]:
    purchase = [item for item in snapshot.items if item.source == "CATALOG_TO_BUY"]
    return (
        sum((item.price or 0) * item.quantity for item in purchase if item.price is not None),
        sum(1 for item in purchase if item.price is None),
    )


def fingerprint(snapshot: PlanSnapshot, profile: PreferenceProfileInput) -> str:
    payload = {
        "plan": asdict(snapshot),
        "profile": profile.model_dump(mode="json"),
        "policy_version": POLICY_VERSION,
    }
    return hashlib.sha256(json.dumps(payload, ensure_ascii=False, sort_keys=True).encode("utf-8")).hexdigest()


def assess(snapshot: PlanSnapshot, profile: PreferenceProfileInput) -> FitAssessment:
    weights = WEIGHTS[profile.priority_focus]
    raw = {
        "BUDGET": _budget(snapshot, profile),
        "NEEDS": _needs(snapshot, profile),
        "EXISTING_FURNITURE": _existing(snapshot, profile),
        "STYLE": _style(snapshot, profile),
        "COMPOSITION": _composition(snapshot),
    }
    available_weight = sum(weights[code] for code, result in raw.items() if result[0] is not None)
    axes: list[FitAxis] = []
    weighted_sum = 0.0
    for code, (score, evidence, reason) in raw.items():
        applied = (weights[code] / available_weight * 100) if score is not None and available_weight else 0.0
        if score is not None:
            weighted_sum += score * weights[code]
        axes.append(
            FitAxis(
                code=code,
                label=AXIS_LABELS[code],
                score=score,
                available=score is not None,
                base_weight=weights[code],
                applied_weight=round(applied, 1),
                evidence=evidence,
                reason=reason,
            )
        )
    overall = round(weighted_sum / available_weight) if available_weight else 0
    strongest = max((axis for axis in axes if axis.available), key=lambda axis: axis.score or 0, default=None)
    summary = f"現在の適合度は{overall}点です。"
    if strongest:
        summary += f" {strongest.label}が最も安定しています。"
    return FitAssessment(
        policy_version=POLICY_VERSION,
        overall_score=overall,
        axes=axes,
        summary=summary,
        fingerprint=fingerprint(snapshot, profile),
    )


def _budget(snapshot: PlanSnapshot, profile: PreferenceProfileInput):
    total, unknown = known_total(snapshot)
    if not profile.budget_max or unknown:
        return None, [], "予算未設定または価格未取得の商品があるため評価対象外です。"
    if total <= profile.budget_max:
        return 100, [f"購入候補額 {total:,}円 / 予算 {profile.budget_max:,}円"], "予算内です。"
    over_ratio = (total - profile.budget_max) / profile.budget_max
    score = max(0, round(100 - 200 * over_ratio))
    return score, [f"予算を {total - profile.budget_max:,}円超過"], "超過率に基づく機械計算です。"


def _needs(snapshot: PlanSnapshot, profile: PreferenceProfileInput):
    if not profile.needs:
        return None, [], "困りごとが未選択のため評価対象外です。"
    counts = Counter(item.category for item in snapshot.items)
    scores = []
    evidence = []
    for need in profile.needs:
        required = Counter(NEED_TEMPLATES[need])
        matched = sum(min(counts[category], count) for category, count in required.items())
        scores.append(round(matched / sum(required.values()) * 100))
        evidence.append(f"{need}: 必要役割 {matched}/{sum(required.values())}")
    return round(sum(scores) / len(scores)), evidence, "商品カテゴリと必要数だけで判定しています。"


def _existing(snapshot: PlanSnapshot, profile: PreferenceProfileInput):
    existing = [item for item in snapshot.items if item.source == "EXISTING_EXTERNAL"]
    if not existing or not profile.preserve_existing_furniture:
        return None, [], "残したい手持ち家具がないため評価対象外です。"
    purchase_counts = Counter(item.category for item in snapshot.items if item.source == "CATALOG_TO_BUY")
    existing_categories = [EXISTING_FURNITURE_CATEGORY_BY_ROLE.get(item.role) for item in existing]
    conflicts = sum(1 for category in existing_categories if category and purchase_counts[category] > 0)
    score = max(0, 100 - conflicts * 25)
    reason = "確実に対応できる構造化カテゴリだけを比較し、見た目の相性は断定しません。"
    if any(item.role == "SUPPORT_FURNITURE" for item in existing):
        reason += " SUPPORT_FURNITUREは机・椅子等を区別できないため重複扱いしません。"
    return score, [f"手持ち家具 {len(existing)}点", f"明確なカテゴリ重複 {conflicts}件"], reason


def _style(snapshot: PlanSnapshot, profile: PreferenceProfileInput):
    if not profile.preferred_style:
        return None, [], "好みのテイストが未選択のため評価対象外です。"
    if profile.preferred_style not in VERIFIED_STYLES:
        return None, [], "このテイストは公式商品スナップショットで検証できないため評価対象外です。"
    verified = [
        item for item in snapshot.items
        if item.provenance == "NITORI_OFFICIAL_SNAPSHOT" and item.style_hint in VERIFIED_STYLES
    ]
    if not verified:
        return None, [], "検証済みの公式商品情報がないため評価対象外です。"
    matches = sum(1 for item in verified if item.style_hint == profile.preferred_style)
    return round(matches / len(verified) * 100), [f"検証可能 {len(verified)}点中 一致 {matches}点"], "公式商品の確認済みstyle_hintだけで判定しています。"


def _composition(snapshot: PlanSnapshot):
    purchase = [item for item in snapshot.items if item.source == "CATALOG_TO_BUY"]
    if not purchase:
        return None, [], "購入候補商品がないため評価対象外です。"
    ids = [item.product_id for item in purchase if item.product_id]
    duplicate_count = len(ids) - len(set(ids))
    role_count = len({item.role for item in purchase})
    count_penalty = 0 if 3 <= len(purchase) <= 7 else min(30, abs(len(purchase) - 5) * 8)
    score = max(0, 100 - duplicate_count * 30 - count_penalty - (15 if role_count < 2 else 0))
    return score, [f"購入候補 {len(purchase)}点", f"役割 {role_count}種類", f"重複 {duplicate_count}件"], "点数・役割・同一商品重複だけを確認しています。"


def _role_category(role: str) -> str:
    return {
        "MAIN_FURNITURE": "BED",
        "SUPPORT_FURNITURE": "SUPPORT",
        "STORAGE": "STORAGE",
        "LIGHTING": "LIGHTING",
        "TEXTILE": "TEXTILE",
    }.get(role, "OTHER")
