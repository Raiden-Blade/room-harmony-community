from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import analytics, catalog, community, plans, saved
from app.core.config import Settings
from app.core.database import Base, create_database
from app.core.schema import upgrade_demo_schema
from app.services.seed import seed_if_empty


def create_app(settings: Settings | None = None) -> FastAPI:
    active_settings = settings or Settings()
    database_path = _sqlite_path(active_settings.database_url)
    if database_path:
        database_path.parent.mkdir(parents=True, exist_ok=True)
    active_settings.upload_dir.mkdir(parents=True, exist_ok=True)
    engine, session_factory = create_database(active_settings.database_url)

    @asynccontextmanager
    async def lifespan(_: FastAPI):
        Base.metadata.create_all(engine)
        upgrade_demo_schema(engine)
        with session_factory() as session:
            seed_if_empty(session, active_settings.seed_path)
        yield
        engine.dispose()

    app = FastAPI(
        title=active_settings.app_name,
        version="0.1.0",
        description="Functional MVP API. All bundled content and prices are synthetic demo data.",
        lifespan=lifespan,
    )
    app.state.settings = active_settings
    app.state.engine = engine
    app.state.session_factory = session_factory
    app.mount("/uploads", StaticFiles(directory=active_settings.upload_dir), name="uploads")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=active_settings.cors_origins,
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(catalog.router)
    app.include_router(saved.router)
    app.include_router(plans.router)
    app.include_router(community.router)
    app.include_router(analytics.router)

    @app.get("/health", tags=["system"])
    def health() -> dict[str, str]:
        return {"status": "ok", "dataset": "synthetic-demo"}

    return app


def _sqlite_path(database_url: str) -> Path | None:
    prefix = "sqlite:///"
    if not database_url.startswith(prefix):
        return None
    return Path(database_url.removeprefix(prefix)).resolve()


app = create_app()
