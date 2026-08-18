from __future__ import annotations

from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[2]
REPOSITORY_DIR = BACKEND_DIR.parent


class Settings(BaseSettings):
    app_name: str = "Room Harmony Community API"
    database_url: str = f"sqlite:///{(REPOSITORY_DIR / '.demo' / 'room-harmony-community.db').as_posix()}"
    seed_path: Path = REPOSITORY_DIR / "data" / "seed" / "demo_seed.json"
    upload_dir: Path = REPOSITORY_DIR / ".demo" / "uploads"
    max_upload_bytes: int = 8 * 1024 * 1024
    cors_origins: list[str] = ["http://127.0.0.1:5173", "http://localhost:5173"]

    model_config = SettingsConfigDict(env_prefix="RHC_", env_file=REPOSITORY_DIR / ".env", extra="ignore")

    @field_validator("cors_origins", mode="before")
    @classmethod
    def split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [item.strip() for item in value.split(",") if item.strip()]
        return value

    @field_validator("seed_path", mode="before")
    @classmethod
    def resolve_seed_path(cls, value: object) -> Path:
        path = Path(str(value))
        if path.is_absolute():
            return path
        return (BACKEND_DIR / path).resolve()

    @field_validator("upload_dir", mode="before")
    @classmethod
    def resolve_upload_dir(cls, value: object) -> Path:
        path = Path(str(value))
        if path.is_absolute():
            return path
        return (BACKEND_DIR / path).resolve()
