from __future__ import annotations

import re
from collections.abc import Generator

from fastapi import Header, HTTPException, Request
from sqlalchemy.orm import Session


SESSION_PATTERN = re.compile(r"^[A-Za-z0-9_-]{4,64}$")


def get_db(request: Request) -> Generator[Session, None, None]:
    with request.app.state.session_factory() as session:
        yield session


def get_session_id(x_session_id: str = Header(default="demo-browser")) -> str:
    if not SESSION_PATTERN.fullmatch(x_session_id):
        raise HTTPException(status_code=422, detail="Invalid X-Session-ID")
    return x_session_id
