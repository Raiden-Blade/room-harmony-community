from app.ranking import DiscoveryContext, rank_coordinates
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
