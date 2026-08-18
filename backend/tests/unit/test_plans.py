import pytest
from pydantic import ValidationError

from app.integrations.room_harmony import build_handoff_preview
from app.schemas.common import HandoffRequest
from app.services.plans import (
    add_existing,
    add_product,
    create_plan,
    load_coordinate,
    mark_keep,
    mark_ready,
    replace_item,
)
from app.services.pricing import calculate_price


def test_plan_lifecycle_and_parent_link(seeded_session):
    parent = load_coordinate(seeded_session, "coord-001")
    plan = create_plan(seeded_session, parent, "owner-session")

    assert plan.kind == "PLAN"
    assert plan.status == "DRAFT"
    assert plan.visibility == "PRIVATE"
    assert plan.parent_coordinate_id == parent.id
    assert len(plan.items) == len(parent.items)

    ready = mark_ready(seeded_session, plan)
    assert ready.status == "READY_FOR_ACTION"


def test_existing_furniture_does_not_change_total(seeded_session):
    plan = create_plan(seeded_session, load_coordinate(seeded_session, "coord-002"), "owner-session")
    before = calculate_price(plan).known_total
    updated = add_existing(seeded_session, plan, "手持ちデスク", "SUPPORT_FURNITURE", "幅90cm")

    assert calculate_price(updated).known_total == before
    assert any(item.source == "EXISTING_EXTERNAL" and item.product_id is None for item in updated.items)


def test_keep_replace_and_add_mutations_change_items(seeded_session):
    plan = create_plan(seeded_session, load_coordinate(seeded_session, "coord-001"), "owner-session")
    first = next(item for item in plan.items if item.product_id and item.role == "MAIN_FURNITURE")
    kept = mark_keep(seeded_session, plan, first.id)
    assert next(item for item in kept.items if item.id == first.id).mutation_state == "KEPT"

    replaced = replace_item(seeded_session, kept, first.id, "DEMO-BED-02")
    assert next(item for item in replaced.items if item.id == first.id).product_id == "DEMO-BED-02"
    assert next(item for item in replaced.items if item.id == first.id).mutation_state == "REPLACED"

    added = add_product(seeded_session, replaced, "DEMO-SUPPORT-01", "SUPPORT_FURNITURE")
    assert any(item.product_id == "DEMO-SUPPORT-01" and item.mutation_state == "ADDED" for item in added.items)


def test_handoff_payload_is_preview_only_and_contains_plan_products(seeded_session):
    plan = create_plan(seeded_session, load_coordinate(seeded_session, "coord-001"), "owner-session")
    payload = build_handoff_preview(plan, HandoffRequest(return_url=f"/plans/{plan.id}"))

    assert payload.coordinate_id == plan.id
    assert payload.coordinate_kind == "PLAN"
    assert payload.live_integration is False
    assert payload.anchor_product_id in payload.product_ids
    assert payload.return_url.startswith("/")


@pytest.mark.parametrize("return_url", ["https://evil.example/", "//evil.example/", "/\\evil.example/"])
def test_handoff_return_url_rejects_external_or_ambiguous_paths(return_url):
    with pytest.raises(ValidationError):
        HandoffRequest(return_url=return_url)


def test_handoff_store_id_rejects_free_text():
    with pytest.raises(ValidationError):
        HandoffRequest(store_id="my home address")

    with pytest.raises(ValidationError):
        HandoffRequest(store_id="1234567890")

    assert HandoffRequest(store_id="DEMO-STORE-001").store_id == "DEMO-STORE-001"
