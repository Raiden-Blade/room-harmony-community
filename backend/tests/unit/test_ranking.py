import pytest

from app.ranking import DiscoveryContext, rank_coordinates
from app.ranking.similarity import score_coordinate
from app.repositories.catalog import list_public_coordinates


def test_golden_storage_case_ranks_coord_001_first(seeded_session):
    context = DiscoveryContext(
        room_size="SMALL_6",
        need="STORAGE",
        budget_max=50_000,
        room_type="ONE_ROOM",
        housing="RENTAL",
        household="SINGLE",
    )
    ranked = rank_coordinates(list_public_coordinates(seeded_session), context)

    assert ranked[0][0].id == "coord-001"
    assert "6畳前後に近い" in ranked[0][2]
    assert "収納不足に対応" in ranked[0][2]
    assert "予算5万円以内" in ranked[0][2]


def test_popular_baseline_uses_editorial_order(seeded_session):
    ranked = rank_coordinates(list_public_coordinates(seeded_session), DiscoveryContext(), mode="popular")
    assert [row[0].id for row in ranked[:3]] == ["coord-001", "coord-002", "coord-003"]
    assert ranked[0][2] == ["編集部ピック"]


def test_budget_overage_is_penalized(seeded_session):
    coordinates = list_public_coordinates(seeded_session)
    context = DiscoveryContext(room_size="SMALL_6", need="STORAGE", budget_max=30_000)
    scored = {coordinate.id: score for coordinate, score, _ in rank_coordinates(coordinates, context)}
    assert scored["coord-001"] < 70


@pytest.mark.parametrize(
    ("context", "expected_delta", "expected_reason"),
    [
        (DiscoveryContext(need="STORAGE"), 40, "収納不足に対応"),
        (DiscoveryContext(room_size="SMALL_6"), 30, "6畳前後に近い"),
        (DiscoveryContext(budget_max=50_000), 25, "予算5万円以内"),
        (DiscoveryContext(room_type="ONE_ROOM"), 10, "One Room"),
        (DiscoveryContext(housing="RENTAL"), 8, "Rental"),
        (DiscoveryContext(household="SINGLE"), 8, "Single"),
        (DiscoveryContext(style="NATURAL"), 12, "Natural"),
    ],
)
def test_each_similarity_dimension_has_a_fixed_explainable_weight(
    seeded_session, context, expected_delta, expected_reason
):
    coordinate = next(item for item in list_public_coordinates(seeded_session) if item.id == "coord-001")
    score, reasons = score_coordinate(coordinate, context)

    assert score == expected_delta
    assert expected_reason in reasons


def test_existing_furniture_compatibility_is_explainable(seeded_session):
    coordinate = next(
        item
        for item in list_public_coordinates(seeded_session)
        if any(candidate.source == "EXISTING_EXTERNAL" for candidate in item.items)
    )
    score, reasons = score_coordinate(coordinate, DiscoveryContext(has_existing_furniture=True))

    assert score == 6
    assert reasons == ["手持ち家具を活かせる"]


def test_ties_use_editorial_rank_then_coordinate_id(seeded_session):
    first, second = list_public_coordinates(seeded_session)[:2]
    first.editorial_rank = second.editorial_rank = 777
    ranked = rank_coordinates([second, first], DiscoveryContext())

    assert [row[0].id for row in ranked] == sorted([first.id, second.id])


def _categories(coordinate):
    return [item.product.category for item in coordinate.items if item.product]


def _coordinates_for_need(seeded_session, need):
    return [
        coordinate
        for coordinate in list_public_coordinates(seeded_session)
        if need in {item.need_code for item in coordinate.needs}
    ]


def test_need_specific_product_compositions_are_not_blanket_category_sets(seeded_session):
    sleep = _coordinates_for_need(seeded_session, "SLEEP")
    relax = _coordinates_for_need(seeded_session, "RELAX")
    work = _coordinates_for_need(seeded_session, "WORK_FROM_HOME")
    storage = _coordinates_for_need(seeded_session, "STORAGE")

    assert sleep and all("DESK" not in _categories(coordinate) for coordinate in sleep)
    assert relax and all("DESK" not in _categories(coordinate) for coordinate in relax)
    assert work and all({"DESK", "SUPPORT", "LIGHTING"}.issubset(_categories(coordinate)) for coordinate in work)
    assert storage and all(_categories(coordinate).count("STORAGE") >= 2 for coordinate in storage)


def test_low_budget_coordinates_fit_their_displayed_budget(seeded_session):
    low_budget = _coordinates_for_need(seeded_session, "LOW_BUDGET")

    assert low_budget
    for coordinate in low_budget:
        total = sum(item.price_snapshot or 0 for item in coordinate.items if item.product)
        assert total <= coordinate.budget_max <= 50_000


def test_built_in_reference_records_are_not_user_real_rooms(seeded_session):
    built_in = list_public_coordinates(seeded_session)

    assert built_in
    assert all(coordinate.kind == "PLAN" for coordinate in built_in)
    assert all(coordinate.verification_state == "DEMO_ONLY" for coordinate in built_in)
