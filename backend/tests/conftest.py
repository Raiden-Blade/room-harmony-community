from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core.config import REPOSITORY_DIR, Settings
from app.main import create_app


@pytest.fixture
def client(tmp_path: Path):
    settings = Settings(
        database_url=f"sqlite:///{(tmp_path / 'test.db').as_posix()}",
        seed_path=REPOSITORY_DIR / "data" / "seed" / "demo_seed.json",
        cors_origins=["http://testserver"],
    )
    with TestClient(create_app(settings)) as test_client:
        test_client.headers["X-Session-ID"] = "test-session"
        yield test_client


@pytest.fixture
def seeded_session(client: TestClient):
    with client.app.state.session_factory() as session:
        yield session
