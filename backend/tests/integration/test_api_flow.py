def test_health_and_discovery_api(client):
    assert client.get("/health").json() == {"status": "ok", "dataset": "mixed-prototype-snapshot"}
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
    assert coordinate.json()["price"]["status"] == "NITORI_OFFICIAL_SNAPSHOT"
    products = [item["product"] for item in coordinate.json()["items"] if item["product"]]
    assert len(products) >= 5
    assert all(product["id"].startswith("NTR-") for product in products)
    assert all(product["provenance"] == "NITORI_OFFICIAL_SNAPSHOT" for product in products)
    assert len({product["image_url"] for product in products}) == len(products)

    product_id = products[0]["id"]
    product = client.get(f"/api/products/{product_id}")
    assert product.status_code == 200
    assert product.json()["image_url"] == products[0]["image_url"]
    assert product.json()["name"] == products[0]["name"]
    assert product.json()["price_snapshot"] == products[0]["price_snapshot"]
    assert any(row["id"] == "coord-001" for row in product.json()["coordinates"])


def test_save_and_plan_creation_api(client):
    assert client.post("/api/saved/coord-001").json()["saved"] is True
    assert any(item["id"] == "coord-001" for item in client.get("/api/saved").json())

    created = client.post("/api/plans/from-coordinate/coord-001", json={"budget_max": 50_000})
    assert created.status_code == 201
    assert created.json()["parent_coordinate_id"] == "coord-001"
    assert created.json()["kind"] == "PLAN"
    assert "owner_session_id" not in created.json()


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
    owner_headers = {"X-Session-ID": "owner-session"}
    plan = client.post("/api/plans/from-coordinate/coord-001", json={}, headers=owner_headers).json()
    other_headers = {"X-Session-ID": "other-session"}
    item_id = next(item["id"] for item in plan["items"] if item["product"])

    assert client.get(f"/api/plans/{plan['id']}", headers=other_headers).status_code == 404
    assert client.get(f"/api/coordinates/{plan['id']}", headers=other_headers).status_code == 404
    assert client.post(
        f"/api/plans/from-coordinate/{plan['id']}", json={}, headers=other_headers
    ).status_code == 404
    assert client.post(f"/api/saved/{plan['id']}", headers=other_headers).status_code == 404
    assert client.post(
        f"/api/plans/{plan['id']}/items/{item_id}/keep", headers=other_headers
    ).status_code == 404
    assert client.post(
        f"/api/plans/{plan['id']}/items/{item_id}/replace",
        json={"product_id": "DEMO-BED-02"},
        headers=other_headers,
    ).status_code == 404
    assert client.post(
        f"/api/plans/{plan['id']}/items",
        json={"product_id": "DEMO-SUPPORT-01", "role": "SUPPORT_FURNITURE"},
        headers=other_headers,
    ).status_code == 404
    assert client.post(
        f"/api/plans/{plan['id']}/existing-furniture",
        json={"label": "probe", "category": "OTHER"},
        headers=other_headers,
    ).status_code == 404
    assert client.post(f"/api/plans/{plan['id']}/ready", headers=other_headers).status_code == 404
    assert client.post(
        f"/api/plans/{plan['id']}/handoff-preview", json={}, headers=other_headers
    ).status_code == 404
    assert all(
        row["id"] != plan["id"]
        for row in client.get("/api/coordinates", params={"limit": 50}, headers=other_headers).json()["results"]
    )
    assert all(row["id"] != plan["id"] for row in client.get("/api/plans", headers=other_headers).json())


def test_analytics_validation_and_readiness_api(client):
    accepted = client.post(
        "/api/analytics/events",
        json={
            "event_name": "discovery_impression",
            "comparison_condition": "similar",
            "properties": {"mode": "similar", "rank": 1, "match_dimension_count": 3},
        },
    )
    assert accepted.status_code == 202
    product_reference = client.post(
        "/api/analytics/events",
        json={"event_name": "product_view", "product_id": "NTR-2110600044491-0000002000852"},
    )
    assert product_reference.status_code == 202
    rejected = client.post(
        "/api/analytics/events",
        json={"event_name": "product_view", "properties": {"free_text": "do not store"}},
    )
    assert rejected.status_code == 422
    readiness = client.get("/api/analytics/readiness").json()
    assert readiness["event_counts"]["discovery_impression"] == 1
    assert "Randomized A/B" in readiness["disclaimer"]


def test_discovery_exposes_user_selected_comparison_condition_not_experiment_assignment(client):
    for mode in ("similar", "popular", "newlife"):
        body = client.get("/api/coordinates", params={"mode": mode, "limit": 1}).json()
        assert body["comparison_condition"] == mode
        assert "experiment_group" not in body
