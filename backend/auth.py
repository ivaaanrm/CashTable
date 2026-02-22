import random
import uuid

from fastapi import HTTPException, Request
from sqlalchemy.orm import Session

from backend.models import Game, Session as GameSession

SESSION_COOKIE_NAME = "session_token"
SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 30  # 30 days


def _unauthorized(detail: str = "Authentication required") -> HTTPException:
    return HTTPException(status_code=401, detail={"error": "Unauthorized", "message": detail})


def _forbidden(detail: str = "Host role required") -> HTTPException:
    return HTTPException(status_code=403, detail={"error": "Forbidden", "message": detail})


def get_cookie_token(request: Request) -> str | None:
    return request.cookies.get(SESSION_COOKIE_NAME)


def require_cookie_token(request: Request) -> str:
    token = get_cookie_token(request)
    if not token:
        raise _unauthorized()
    return token


def resolve_session_for_game(db: Session, request: Request, game_id: int, required: bool = True) -> GameSession | None:
    token = get_cookie_token(request)
    if not token:
        if required:
            raise _unauthorized()
        return None

    session = (
        db.query(GameSession)
        .filter(GameSession.token == token, GameSession.game_id == game_id)
        .first()
    )
    if required and not session:
        raise _unauthorized("No session for this game")
    return session


def require_game_session(db: Session, request: Request, game_id: int) -> GameSession:
    session = resolve_session_for_game(db, request, game_id, required=True)
    assert session is not None
    return session


def require_host_session(db: Session, request: Request, game_id: int) -> GameSession:
    session = require_game_session(db, request, game_id)
    if session.role != "host":
        raise _forbidden()
    return session


def generate_pin(db: Session, max_attempts: int = 100) -> str:
    for _ in range(max_attempts):
        candidate = str(random.randint(100000, 999999))
        conflict = (
            db.query(Game)
            .filter(Game.pin == candidate, Game.status == "active")
            .first()
        )
        if not conflict:
            return candidate
    raise HTTPException(
        status_code=503,
        detail={"error": "ServiceUnavailable", "message": "Unable to allocate game PIN"},
    )


def issue_or_reuse_token(request: Request) -> str:
    existing = get_cookie_token(request)
    return existing or str(uuid.uuid4())
