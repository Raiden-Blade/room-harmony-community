def test_health_and_discovery_api(client):
    assert client.get("/health").json() == {"status": "ok", "dataset": "synthetic-demo"}
    response = client.get(
        "/api/coordinates",
        params={"mode": "similar", "room_size": "SMALL_6", "need": "STORAGE", "budget_max": 50_000},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["results"][0]["id"] == "coord-001"
    assert body["results"][0]["match_reasons"]


def test_coordinate_and_product_to_coordinate_api(client):
    coordinate = client.get("/api/coordinates/coord-001")
    assert coordinate.status_code == 200
    assert len(coordinate.json()["items"]) >= 5

    product_id = coordinate.json()["items"][0]["product"]["id"]
    product = client.get(f"/api/products/{product_id}")
    assert product.status_code == 200
    assert any(row["id"] == "coord-001" for row in product.json()["coordinates"])


def test_save_and_plan_creation_api(client):
    assert client.post("/api/saved/coord-001").json()["saved"] is True
    assert any(item["id"] == "coord-001" for item in client.get("/api/saved").json())

    created = client.post("/api/plans/from-coordinate/coord-001", json={"budget_max": 50_000})
    assert created.status_code == 201
    assert created.json()["parent_coordinate_id"] == "coord-001"
    assert created.json()["kind"] == "PLAN"


def test_plan_update_and_handoff_preview_api(client):
    plan = client.post("/api/plans/from-coordinate/coord-001", json={}).json()
    plan_id = plan["id"]
    bed_item = next(item for item in plan["items"] if item["role"] == "MAIN_FURNITURE")

    kept = client.post(f"/api/plans/{plan_id}/items/{bed_item['id']}/keep")
    assert kept.status_code == 200
    replaced = client.post(
        f"/api/plans/{plan_id}/items/{bed_item['id']}/replace", json={"product_id": "DEMO-BED-02"}
    )
    assert replaced.status_code == 200
    existing = client.post(
        f"/api/plans/{plan_id}/existing-furniture",
        json={"label": "手持ちの机", "category": "SUPPORT_FURNITURE", "dimensions": "幅90cm"},
    )
    assert existing.status_code == 200
    assert any(item["source"] == "EXISTING_EXTERNAL" for item in existing.json()["items"])
    ready = client.post(f"/api/plans/{plan_id}/ready")
    assert ready.json()["status"] == "READY_FOR_ACTION"

    preview = client.post(
        f"/api/plans/{plan_id}/handoff-preview", json={"return_url": f"/plans/{plan_id}"}
    )
    assert preview.status_code == 200
    assert preview.json()["live_integration"] is False
    assert len(preview.json()["product_ids"]) >= 1


def test_private_plan_is_not_visible_or_cloneable_by_another_session(client):
    plan = client.post("/api/plans/from-coordinate/coord-001", json={}).json()
    other_headers = {"X-Session-ID": "other-session"}

    assert client.get(f"/api/plans/{plan['id']}", headers=other_headers).status_code == 404
    assert client.get(f"/api/coordinates/{plan['id']}", headers=other_headers).status_code == 404
    assert client.post(
        f"/api/plans/from-coordinate/{plan['id']}", json={}, headers=other_headers
    ).status_code == 404


def test_analytics_validation_and_readiness_api(client):
    accepted = client.post(
        "/api/analytics/events",
        json={
            "event_name": "discovery_impression",
            "experiment_group": "similar",
            "properties": {"mode": "similar", "rank": 1},
        },
    )
    assert accepted.status_code == 202
    rejected = client.post(
        "/api/analytics/events",
        json={"event_name": "product_view", "properties": {"free_text": "do not store"}},
    )
    assert rejected.status_code == 422
    readiness = client.get("/api/analytics/readiness").json()
    assert readiness["event_counts"]["discovery_impression"] == 1
    assert "改善" in readiness["disclaimer"]
