from __future__ import annotations

import json

import pytest
from pydantic import ValidationError

from app.models import Challenge, ChallengeEntry, Coordinate
from app.schemas.seasonal import ChallengeEntryRequest, Recognition


OWNER = {"X-Session-ID": "seasonal-owner"}
OTHER = {"X-Session-ID": "seasonal-other"}


def create_identity(client, headers=OWNER):
    response = client.put(
        "/api/creators/me",
        json={"display_name": "Seasonal Creator", "bio": "6畳の暮らしを試作します。"},
        headers=headers,
    )
    assert response.status_code == 200
    return response.json()


def public_plan_payload(*, size_band="SMALL_6", budget_max=50000):
    return {
        "kind": "PLAN",
        "title": "Seasonal entry用の6畳PLAN",
        "description": "Challenge参加条件を構造化して確認するUser申告PLANです。",
        "room_type": "ONE_ROOM",
        "size_band": size_band,
        "housing_type": "RENTAL",
        "household": "SINGLE",
        "budget_max": budget_max,
        "style": "NATURAL",
        "needs": ["STORAGE", "LOW_BUDGET"],
        "products": [
            {"product_id": "DEMO-BED-01", "role": "MAIN_FURNITURE", "quantity": 1},
            {"product_id": "DEMO-DESK-01", "role": "SUPPORT_FURNITURE", "quantity": 1},
            {"product_id": "DEMO-STORAGE-01", "role": "STORAGE", "quantity": 1},
        ],
        "existing_furniture": [],
        "image_ids": [],
    }


def publish_plan(client, *, headers=OWNER, size_band="SMALL_6", budget_max=50000):
    create_identity(client, headers)
    response = client.post(
        "/api/community/coordinates",
        json=public_plan_payload(size_band=size_band, budget_max=budget_max),
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


def enter(client, coordinate_id, slug="new-life-6tatami-2028", headers=OWNER, **extra):
    return client.post(
        f"/api/challenges/{slug}/entries",
        json={"coordinate_id": coordinate_id, **extra},
        headers=headers,
    )


def test_seasonal_landing_lists_statuses_and_previous_year_real_records(client):
    landing = client.get("/api/seasonal")
    archived = client.get("/api/challenges?status=ARCHIVED")

    assert landing.status_code == 200
    body = landing.json()
    assert body["featured"]["slug"] == "new-life-6tatami-2028"
    assert body["featured"]["entry_count"] == 3
    assert {item["status"] for item in body["active"]} == {"ACTIVE"}
    assert {item["status"] for item in body["upcoming"]} == {"UPCOMING"}
    assert {item["status"] for item in body["ended"]} == {"ENDED"}
    assert body["archived"][0]["status"] == "ARCHIVED"
    assert {item["id"] for item in body["previous_year_coordinates"]} == {
        "coord-001",
        "coord-003",
        "coord-005",
    }
    assert archived.status_code == 200
    assert [item["status"] for item in archived.json()["results"]] == ["ARCHIVED"]


def test_challenge_detail_exposes_structured_constraints_breakdown_and_prototype_pick(client):
    response = client.get("/api/challenges/new-life-6tatami-2028")

    assert response.status_code == 200
    body = response.json()
    assert body["participation_count"] == 3
    assert body["real_count"] == 3
    assert body["plan_count"] == 0
    assert body["eligibility"]["size_bands"] == ["SMALL_6"]
    assert {item["code"] for item in body["constraints"]} >= {"SIZE_BAND", "BUDGET_MAX"}
    assert body["prototype_picks"]
    assert body["prototype_picks"][0]["provenance"] == "PROTOTYPE_PICK"
    assert "NITORI" not in body["title"].upper()


def test_owned_valid_entry_succeeds_duplicate_and_cross_session_are_denied(client):
    coordinate = publish_plan(client)

    cross_session = enter(client, coordinate["id"], headers=OTHER)
    accepted = enter(client, coordinate["id"])
    duplicate = enter(client, coordinate["id"])

    assert cross_session.status_code == 404
    assert accepted.status_code == 201
    assert accepted.json()["coordinate_id"] == coordinate["id"]
    assert accepted.json()["recognition"] is None
    assert accepted.json()["provenance"] == "USER"
    assert duplicate.status_code == 409


@pytest.mark.parametrize(
    ("size_band", "budget_max", "reason"),
    [
        ("MEDIUM_7_8", 50000, "ROOM_MISMATCH"),
        ("SMALL_6", 90000, "BUDGET_MISMATCH"),
    ],
)
def test_structured_eligibility_rejects_room_and_budget_mismatch(
    client, size_band, budget_max, reason
):
    coordinate = publish_plan(client, size_band=size_band, budget_max=budget_max)
    response = enter(client, coordinate["id"])

    assert response.status_code == 422
    assert reason in response.json()["detail"]["reasons"]


def test_real_only_and_inactive_challenges_reject_plan(client):
    coordinate = publish_plan(client)
    with client.app.state.session_factory() as session:
        challenge = session.get(Challenge, "challenge-newlife-2028")
        rules = json.loads(challenge.eligibility_json)
        rules["kinds"] = ["REAL"]
        rules["image_required"] = True
        challenge.eligibility_json = json.dumps(rules)
        session.commit()

    real_only = enter(client, coordinate["id"])
    inactive = enter(client, coordinate["id"], slug="new-life-6tatami-2027")

    assert real_only.status_code == 422
    assert "KIND_MISMATCH" in real_only.json()["detail"]["reasons"]
    assert inactive.status_code == 409


def test_entry_payload_cannot_self_assign_recognition_and_enum_is_controlled():
    with pytest.raises(ValidationError):
        ChallengeEntryRequest.model_validate(
            {"coordinate_id": "coord-001", "recognition": "OFFICIAL_PICK"}
        )
    with pytest.raises(ValidationError):
        from pydantic import TypeAdapter

        TypeAdapter(Recognition).validate_python("MOST_POPULAR")


def test_unpublish_withdraws_entry_without_deleting_lineage_record(client):
    coordinate = publish_plan(client)
    assert enter(client, coordinate["id"]).status_code == 201

    unpublish = client.delete(f"/api/community/coordinates/{coordinate['id']}", headers=OWNER)
    assert unpublish.status_code == 204

    with client.app.state.session_factory() as session:
        entry = session.query(ChallengeEntry).filter_by(coordinate_id=coordinate["id"]).one()
        assert entry.status == "WITHDRAWN"
        assert entry.withdrawn_at is not None
        assert session.get(Coordinate, coordinate["id"]) is not None
    detail = client.get("/api/challenges/new-life-6tatami-2028").json()
    assert coordinate["id"] not in {item["coordinate_id"] for item in detail["entries"]}


def test_hidden_coordinate_is_not_visible_in_challenge_gallery(client):
    coordinate = publish_plan(client)
    assert enter(client, coordinate["id"]).status_code == 201
    with client.app.state.session_factory() as session:
        row = session.get(Coordinate, coordinate["id"])
        row.moderation_status = "HIDDEN"
        session.commit()

    detail = client.get("/api/challenges/new-life-6tatami-2028").json()
    assert coordinate["id"] not in {item["coordinate_id"] for item in detail["entries"]}


def test_archived_coordinate_can_be_adapted_published_and_entered_with_lineage(client):
    plan = client.post(
        "/api/plans/from-coordinate/coord-001",
        json={},
        headers=OWNER,
    )
    assert plan.status_code == 201
    create_identity(client)
    derivative = client.post(
        f"/api/plans/{plan.json()['id']}/publish",
        json={
            "kind": "PLAN",
            "image_ids": [],
            "derivation_type": "STORAGE_FOCUS",
            "remix_note": "前年の例を今年向けに再利用",
        },
        headers=OWNER,
    )
    assert derivative.status_code == 201, derivative.text

    accepted = enter(client, derivative.json()["id"])
    assert accepted.status_code == 201, accepted.text
    detail = client.get(f"/api/coordinates/{derivative.json()['id']}", headers=OWNER).json()
    assert detail["genealogy"]["root"]["id"] == "coord-001"
    assert detail["challenge_contexts"][0]["challenge_slug"] == "new-life-6tatami-2028"
    creator = client.get("/api/creators/me", headers=OWNER).json()
    assert creator["seasonal"]["challenge_entries"] == 1
    assert creator["seasonal"]["participations"][0]["coordinate_id"] == derivative.json()["id"]
    assert creator["seasonal"]["direct_seasonal_reuse_count"] == 0

    direct_child = client.post(
        f"/api/plans/from-coordinate/{derivative.json()['id']}",
        json={},
        headers=OTHER,
    )
    assert direct_child.status_code == 201
    creator = client.get("/api/creators/me", headers=OWNER).json()
    assert creator["seasonal"]["direct_seasonal_reuse_count"] == 1
