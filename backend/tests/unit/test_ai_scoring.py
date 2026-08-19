from app.ai.schemas import PreferenceProfileInput
from dataclasses import replace

from app.ai.scoring import ItemFact, PlanSnapshot, assess


def _item(product_id: str, category: str, role: str, price: int, style: str = "NATURAL"):
    return ItemFact(
        item_id=1,
        product_id=product_id,
        name="公式参照商品",
        role=role,
        category=category,
        source="CATALOG_TO_BUY",
        mutation_state="ORIGINAL",
        quantity=1,
        price=price,
        provenance="NITORI_OFFICIAL_SNAPSHOT",
        style_hint=style,
    )


def test_budget_formula_and_available_weight_renormalization():
    snapshot = PlanSnapshot("plan-test", (
        _item("NTR-BED", "BED", "MAIN_FURNITURE", 60_000),
        _item("NTR-STORAGE", "STORAGE", "STORAGE", 10_000),
    ))
    profile = PreferenceProfileInput(
        room_size="SMALL_6",
        housing_type="RENTAL",
        budget_max=50_000,
        needs=["STORAGE"],
        preferred_style="NATURAL",
        priority_focus="BUDGET",
        preserve_existing_furniture=False,
    )

    fit = assess(snapshot, profile)
    budget = next(axis for axis in fit.axes if axis.code == "BUDGET")
    available = [axis for axis in fit.axes if axis.available]

    assert budget.score == 20  # 40% over budget => 100 - (200 * .4)
    assert next(axis for axis in fit.axes if axis.code == "EXISTING_FURNITURE").score is None
    assert round(sum(axis.applied_weight for axis in available), 1) == 100.0


def test_unverified_style_is_unavailable_instead_of_counting_demo_semantics():
    snapshot = PlanSnapshot("plan-test", (_item("NTR-BED", "BED", "MAIN_FURNITURE", 20_000),))
    profile = PreferenceProfileInput(
        room_size="SMALL_6",
        housing_type="RENTAL",
        budget_max=50_000,
        needs=["SLEEP"],
        preferred_style="ELEGANT",
        priority_focus="STYLE",
        preserve_existing_furniture=False,
    )

    style = next(axis for axis in assess(snapshot, profile).axes if axis.code == "STYLE")

    assert style.score is None
    assert "評価対象外" in style.reason


def test_need_coverage_existing_furniture_and_composition_use_structured_facts_only():
    bed = _item("NTR-BED", "BED", "MAIN_FURNITURE", 20_000)
    storage = replace(_item("NTR-STORAGE", "STORAGE", "STORAGE", 8_000), item_id=2)
    existing = ItemFact(
        item_id=3,
        product_id=None,
        name="手持ち家具",
        role="STORAGE",
        category="STORAGE",
        source="EXISTING_EXTERNAL",
        mutation_state="ORIGINAL",
        quantity=1,
        price=None,
        provenance=None,
        style_hint=None,
    )
    profile = PreferenceProfileInput(
        room_size="SMALL_6",
        housing_type="RENTAL",
        budget_max=50_000,
        needs=["STORAGE"],
        preferred_style="NATURAL",
        priority_focus="EXISTING_FURNITURE",
        preserve_existing_furniture=True,
    )

    fit = assess(PlanSnapshot("plan-test", (bed, storage, existing)), profile)
    axes = {axis.code: axis for axis in fit.axes}

    assert axes["NEEDS"].score == 60  # BED + purchase/existing STORAGE fill 3 of 5 required slots
    assert axes["EXISTING_FURNITURE"].score == 75
    assert "役割重複 1件" in axes["EXISTING_FURNITURE"].evidence
    assert axes["COMPOSITION"].score == 76  # two purchase items, two roles, no duplicate ID


def test_composition_penalizes_duplicate_purchase_ids():
    bed = _item("NTR-BED", "BED", "MAIN_FURNITURE", 20_000)
    duplicate = replace(bed, item_id=2)
    distinct = replace(_item("NTR-STORAGE", "STORAGE", "STORAGE", 8_000), item_id=2)
    profile = PreferenceProfileInput(
        room_size="SMALL_6",
        housing_type="RENTAL",
        budget_max=50_000,
        needs=[],
        preferred_style=None,
        priority_focus="BALANCED",
        preserve_existing_furniture=False,
    )

    duplicate_score = next(
        axis.score for axis in assess(PlanSnapshot("duplicate", (bed, duplicate)), profile).axes
        if axis.code == "COMPOSITION"
    )
    distinct_score = next(
        axis.score for axis in assess(PlanSnapshot("distinct", (bed, distinct)), profile).axes
        if axis.code == "COMPOSITION"
    )

    assert duplicate_score is not None and distinct_score is not None
    assert duplicate_score < distinct_score
