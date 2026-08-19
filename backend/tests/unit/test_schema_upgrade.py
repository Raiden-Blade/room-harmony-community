from fastapi.testclient import TestClient
from sqlalchemy import create_engine, func, inspect, select, text

from app.core.config import REPOSITORY_DIR, Settings
from app.core.schema import GOAL2_COORDINATE_COLUMNS, upgrade_demo_schema
from app.main import create_app
from app.models import Challenge, ChallengeEntry, Coordinate


def test_goal1_sqlite_schema_is_upgraded_without_rebuilding_data(tmp_path):
    database = tmp_path / "goal1.db"
    engine = create_engine(f"sqlite:///{database.as_posix()}")
    with engine.begin() as connection:
        connection.execute(
            text("CREATE TABLE coordinates (id VARCHAR(64) PRIMARY KEY, visibility VARCHAR(16) NOT NULL)")
        )
        connection.execute(text("INSERT INTO coordinates (id, visibility) VALUES ('coord-old', 'PUBLIC')"))

    upgrade_demo_schema(engine)

    columns = {column["name"] for column in inspect(engine).get_columns("coordinates")}
    assert set(GOAL2_COORDINATE_COLUMNS).issubset(columns)
    with engine.connect() as connection:
        row = connection.execute(
            text("SELECT id, root_coordinate_id, moderation_status FROM coordinates WHERE id = 'coord-old'")
        ).mappings().one()
    assert row == {"id": "coord-old", "root_coordinate_id": "coord-old", "moderation_status": "ACTIVE"}
    engine.dispose()


def test_goal2_database_adds_goal3_tables_and_seeds_without_reseeding_coordinates(tmp_path):
    database = tmp_path / "goal2-to-goal3.db"
    settings = Settings(
        database_url=f"sqlite:///{database.as_posix()}",
        seed_path=REPOSITORY_DIR / "data" / "seed" / "demo_seed.json",
        seasonal_seed_path=REPOSITORY_DIR / "data" / "seed" / "seasonal_seed.json",
        upload_dir=tmp_path / "uploads",
    )
    with TestClient(create_app(settings)) as client:
        with client.app.state.session_factory() as session:
            coordinate_count = session.scalar(select(func.count()).select_from(Coordinate))

    engine = create_engine(f"sqlite:///{database.as_posix()}")
    with engine.begin() as connection:
        connection.execute(text("DROP TABLE challenge_entries"))
        connection.execute(text("DROP TABLE challenges"))
    engine.dispose()

    with TestClient(create_app(settings)) as client:
        with client.app.state.session_factory() as session:
            assert session.scalar(select(func.count()).select_from(Coordinate)) == coordinate_count
            assert session.scalar(select(func.count()).select_from(Challenge)) == 6
            assert session.scalar(select(func.count()).select_from(ChallengeEntry)) == 8


def test_restart_repairs_only_stale_built_in_user_provenance(tmp_path):
    database = tmp_path / "stale-built-in-provenance.db"
    settings = Settings(
        database_url=f"sqlite:///{database.as_posix()}",
        seed_path=REPOSITORY_DIR / "data" / "seed" / "demo_seed.json",
        seasonal_seed_path=REPOSITORY_DIR / "data" / "seed" / "seasonal_seed.json",
        upload_dir=tmp_path / "uploads",
    )
    with TestClient(create_app(settings)) as client:
        with client.app.state.session_factory() as session:
            built_in = session.get(Coordinate, "coord-004")
            built_in.provenance = "USER_DECLARED"
            built_in.verification_state = "USER_DECLARED_UNVERIFIED"
            session.commit()

    with TestClient(create_app(settings)) as client:
        with client.app.state.session_factory() as session:
            repaired = session.get(Coordinate, "coord-004")
            assert repaired.provenance in {"DEMO", "STAFF", "OFFICIAL"}
            assert repaired.verification_state == "DEMO_ONLY"
