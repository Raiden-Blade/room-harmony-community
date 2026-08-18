from sqlalchemy import create_engine, inspect, text

from app.core.schema import GOAL2_COORDINATE_COLUMNS, upgrade_demo_schema


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
