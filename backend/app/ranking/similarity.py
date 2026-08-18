from __future__ import annotations

from dataclasses import dataclass

from app.models import Coordinate


@dataclass(frozen=True)
class DiscoveryContext:
    room_size: str | None = None
    need: str | None = None
    budget_max: int | None = None
    room_type: str | None = None
    housing: str | None = None
    household: str | None = None
    style: str | None = None
    has_existing_furniture: bool = False


def score_coordinate(coordinate: Coordinate, context: DiscoveryContext) -> tuple[int, list[str]]:
    score = 0
    reasons: list[str] = []
    need_codes = {need.need_code for need in coordinate.needs}

    if context.need and context.need in need_codes:
        score += 40
        reasons.append(_need_reason(context.need))
    if context.room_size and coordinate.size_band == context.room_size:
        score += 30
        reasons.append(f"{_size_label(context.room_size)}に近い")
    if context.budget_max:
        if coordinate.budget_max <= context.budget_max:
            score += 25
            reasons.append(f"予算{context.budget_max // 10_000}万円以内")
        else:
            over_ratio = min((coordinate.budget_max - context.budget_max) / context.budget_max, 1)
            score -= round(20 * over_ratio)
    if context.room_type and coordinate.room_type == context.room_type:
        score += 10
        reasons.append(_enum_label(context.room_type))
    if context.housing and coordinate.housing_type == context.housing:
        score += 8
        reasons.append(_enum_label(context.housing))
    if context.household and coordinate.household == context.household:
        score += 8
        reasons.append(_enum_label(context.household))
    if context.style and coordinate.style == context.style:
        score += 12
        reasons.append(_enum_label(context.style))
    if context.has_existing_furniture and any(item.source != "CATALOG_TO_BUY" for item in coordinate.items):
        score += 6
        reasons.append("手持ち家具を活かせる")

    if not reasons:
        reasons.append("新生活向け編集部ピック")
    return score, reasons[:4]


def rank_coordinates(
    coordinates: list[Coordinate], context: DiscoveryContext, mode: str = "similar"
) -> list[tuple[Coordinate, int, list[str]]]:
    if mode == "popular":
        return [(item, 0, ["編集部ピック"]) for item in sorted(coordinates, key=lambda c: (c.editorial_rank, c.id))]
    if mode == "newlife":
        seasonal = [item for item in coordinates if item.seasonal_collection == "NEW_LIFE_2027"]
        return [(item, 0, ["新生活2027", "一人暮らし向け"]) for item in sorted(seasonal, key=lambda c: (c.editorial_rank, c.id))]
    scored = [(item, *score_coordinate(item, context)) for item in coordinates]
    return sorted(scored, key=lambda row: (-row[1], row[0].editorial_rank, row[0].id))


def _need_reason(code: str) -> str:
    return {
        "STORAGE": "収納不足に対応",
        "LOW_BUDGET": "低予算を重視",
        "WORK_FROM_HOME": "デスク生活向け",
        "RELAX": "くつろぎ重視",
        "SLEEP": "睡眠環境を重視",
        "COMPACT": "狭い部屋を有効活用",
        "LIGHTING": "照明で雰囲気づくり",
        "RENTAL": "賃貸向け",
    }.get(code, _enum_label(code))


def _size_label(code: str) -> str:
    return {"TINY_5_5": "5.5畳前後", "SMALL_6": "6畳前後", "MEDIUM_7_8": "7〜8畳"}.get(code, code)


def _enum_label(code: str) -> str:
    return code.replace("_", " ").title()
