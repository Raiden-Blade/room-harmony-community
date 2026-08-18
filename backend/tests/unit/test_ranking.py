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
