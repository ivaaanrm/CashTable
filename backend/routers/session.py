from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from backend.auth import SESSION_COOKIE_NAME
from backend.database import get_db
from backend.models import Session as GameSession
from backend.schemas import SessionInfoOut

router = APIRouter(tags=["session"])


@router.get("/session", response_model=SessionInfoOut | None)
def get_session_info(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        return None

    session = (
        db.query(GameSession)
        .join(GameSession.game)
        .filter(GameSession.token == token)
        .order_by(GameSession.created_at.desc())
        .first()
    )
    if not session:
        return None

    return SessionInfoOut(
        game_id=session.game_id,
        role=session.role,
        player_id=session.player_id,
        game_name=session.game.name,
    )


@router.delete("/session", status_code=204)
def delete_session(response: Response, request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if token:
        db.query(GameSession).filter(GameSession.token == token).delete(synchronize_session=False)
        db.commit()

    response.delete_cookie(SESSION_COOKIE_NAME)
