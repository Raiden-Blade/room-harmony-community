from app.main import create_app


def test_openapi_exposes_the_mvp_contract():
    paths = create_app().openapi()["paths"]

    assert "/api/coordinates" in paths
    assert "/api/coordinates/{coordinate_id}" in paths
    assert "/api/products/{product_id}" in paths
    assert "/api/saved/{coordinate_id}" in paths
    assert "/api/plans/from-coordinate/{coordinate_id}" in paths
    assert "/api/plans/{plan_id}/handoff-preview" in paths
    assert "/api/analytics/events" in paths
    assert "/api/analytics/readiness" in paths
