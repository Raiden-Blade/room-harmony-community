from __future__ import annotations

import re
from pathlib import Path

from app.core.config import REPOSITORY_DIR


TEXT_SUFFIXES = {".py", ".ts", ".tsx", ".mjs", ".ps1", ".cmd", ".md", ".yml", ".yaml", ".json", ".txt"}


def _text_files(root: Path):
    for path in root.rglob("*"):
        if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES:
            yield path


def test_repository_sources_do_not_contain_real_looking_openai_secret():
    roots = [
        REPOSITORY_DIR / "backend" / "app",
        REPOSITORY_DIR / "backend" / "tests",
        REPOSITORY_DIR / "frontend" / "src",
        REPOSITORY_DIR / "scripts",
        REPOSITORY_DIR / "docs",
    ]
    matches = []
    pattern = re.compile(r"sk-[A-Za-z0-9_-]{12,}")
    for root in roots:
        for path in _text_files(root):
            if pattern.search(path.read_text(encoding="utf-8")):
                matches.append(path.relative_to(REPOSITORY_DIR).as_posix())
    assert matches == []


def test_key_names_cannot_reach_frontend_source_or_noninteractive_runner():
    frontend = "\n".join(path.read_text(encoding="utf-8") for path in _text_files(REPOSITORY_DIR / "frontend" / "src"))
    runner = (REPOSITORY_DIR / "scripts" / "dev" / "run-backend.mjs").read_text(encoding="utf-8")

    assert "OPENAI_API_KEY" not in frontend
    assert "RHC_OPENAI_API_KEY" not in frontend
    assert "OPENAI_API_KEY: _ignoredOpenAIKey" in runner
    assert "RHC_AI_ENABLED: \"false\"" in runner


def test_launcher_uses_hidden_runtime_input_and_reset_is_secret_agnostic():
    launcher = (REPOSITORY_DIR / "scripts" / "dev" / "start-demo.ps1").read_text(encoding="utf-8")
    reset = (REPOSITORY_DIR / "scripts" / "dev" / "reset-demo.ps1").read_text(encoding="utf-8")
    parameter_block = launcher.split("$ErrorActionPreference", maxsplit=1)[0]

    assert "Read-Host \"OpenAI API key (hidden; press Enter to disable AI)\" -AsSecureString" in launcher
    assert "RHC_OPENAI_API_KEY" in launcher
    assert "OPENAI_API_KEY" not in parameter_block
    assert "RHC_OPENAI_API_KEY" not in parameter_block
    assert "OPENAI_API_KEY" not in reset
    assert "RHC_OPENAI_API_KEY" not in reset
