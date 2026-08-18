from __future__ import annotations

import json
from dataclasses import dataclass

from app.models import Challenge, Coordinate
from app.schemas.seasonal import ChallengeConstraint, ChallengeEligibility


@dataclass(frozen=True)
class EligibilityResult:
    eligible: bool
    codes: tuple[str, ...]
    messages: tuple[str, ...]


def eligibility_for(challenge: Challenge) -> ChallengeEligibility:
    return ChallengeEligibility.model_validate(json.loads(challenge.eligibility_json or "{}"))


def constraints_for(challenge: Challenge) -> list[ChallengeConstraint]:
    return [ChallengeConstraint.model_validate(item) for item in json.loads(challenge.constraints_json or "[]")]


def evaluate_eligibility(challenge: Challenge, coordinate: Coordinate) -> EligibilityResult:
    rules = eligibility_for(challenge)
    failures: list[tuple[str, str]] = []

    if rules.size_bands and coordinate.size_band not in rules.size_bands:
        failures.append(("ROOM_MISMATCH", "部屋の広さがテーマ条件と一致しません。"))
    if rules.households and coordinate.household not in rules.households:
        failures.append(("HOUSEHOLD_MISMATCH", "暮らす人数がテーマ条件と一致しません。"))
    if rules.housing_types and coordinate.housing_type not in rules.housing_types:
        failures.append(("HOUSING_MISMATCH", "住まいの種類がテーマ条件と一致しません。"))
    if rules.budget_max is not None and coordinate.budget_max > rules.budget_max:
        failures.append(("BUDGET_MISMATCH", f"予算上限を{rules.budget_max:,}円以内にしてください。"))
    if rules.kinds and coordinate.kind not in rules.kinds:
        failures.append(("KIND_MISMATCH", f"参加できる種別は{' / '.join(rules.kinds)}です。"))
    if rules.image_required and not (coordinate.images or coordinate.image_url):
        failures.append(("IMAGE_REQUIRED", "このテーマは画像付きCoordinateのみ参加できます。"))
    product_count = sum(1 for item in coordinate.items if item.product_id)
    if rules.min_product_count is not None and product_count < rules.min_product_count:
        failures.append(
            ("PRODUCT_COUNT_MISMATCH", f"デモ商品を{rules.min_product_count}点以上含めてください。")
        )

    return EligibilityResult(
        eligible=not failures,
        codes=tuple(code for code, _ in failures),
        messages=tuple(message for _, message in failures),
    )
