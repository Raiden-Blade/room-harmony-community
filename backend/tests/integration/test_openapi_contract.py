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
    assert "/api/creators/me" in paths
    assert "/api/creators/{creator_id}" in paths
    assert "/api/community/images" in paths
    assert "/api/community/coordinates" in paths
    assert "/api/community/coordinates/{coordinate_id}/helpful" in paths
    assert "/api/community/coordinates/{coordinate_id}/reports" in paths
    assert "/api/plans/{plan_id}/publish" in paths
    assert "/api/seasonal" in paths
    assert "/api/challenges" in paths
    assert "/api/challenges/{challenge_slug}" in paths
    assert "/api/challenges/{challenge_slug}/entries" in paths
    assert "/api/ai/status" in paths
    assert "/api/ai/profile" in paths
    assert "/api/plans/{plan_id}/fit" in paths
    assert "/api/plans/{plan_id}/ai/suggestions" in paths
    assert "/api/plans/{plan_id}/ai/apply" in paths
