from __future__ import annotations

from sqlalchemy import Engine, inspect, text


GOAL2_COORDINATE_COLUMNS = {
    "creator_id": "VARCHAR(64)",
    "root_coordinate_id": "VARCHAR(64)",
    "derivation_type": "VARCHAR(48)",
    "remix_note": "VARCHAR(240)",
    "moderation_status": "VARCHAR(16) NOT NULL DEFAULT 'ACTIVE'",
    "published_at": "DATETIME",
    "unpublished_at": "DATETIME",
}


def upgrade_demo_schema(engine: Engine) -> None:
    """Apply the small, deterministic SQLite upgrade from Goal 1 to Goal 2.

    New tables are created by SQLAlchemy metadata. SQLite cannot add foreign-key
    constraints to an existing table, so lineage and ownership are enforced by
    services and covered by API tests in this local prototype.
    """

    if engine.dialect.name != "sqlite" or "coordinates" not in inspect(engine).get_table_names():
        return
    existing = {column["name"] for column in inspect(engine).get_columns("coordinates")}
    with engine.begin() as connection:
        for name, declaration in GOAL2_COORDINATE_COLUMNS.items():
            if name not in existing:
                connection.execute(text(f"ALTER TABLE coordinates ADD COLUMN {name} {declaration}"))
        connection.execute(
            text(
                "UPDATE coordinates SET moderation_status = 'ACTIVE' "
                "WHERE moderation_status IS NULL OR moderation_status = ''"
            )
        )
        connection.execute(
            text(
                "UPDATE coordinates SET root_coordinate_id = id "
                "WHERE visibility = 'PUBLIC' AND root_coordinate_id IS NULL"
            )
        )
        connection.execute(text("CREATE INDEX IF NOT EXISTS ix_coordinates_creator_id ON coordinates (creator_id)"))
        connection.execute(
            text("CREATE INDEX IF NOT EXISTS ix_coordinates_root_coordinate_id ON coordinates (root_coordinate_id)")
        )
        connection.execute(
            text("CREATE INDEX IF NOT EXISTS ix_coordinates_moderation_status ON coordinates (moderation_status)")
        )
