from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy.orm import Session

from backend.auth import (
    SESSION_COOKIE_MAX_AGE,
    SESSION_COOKIE_NAME,
    generate_pin,
    issue_or_reuse_token,
    require_game_session,
    require_host_session,
)
from backend.database import get_db
from backend.models import Game, Player, Session as GameSession
from backend.schemas import (
    GameCreate,
    GameDetail,
    JoinGameOut,
    GameOut,
    GameUpdate,
    JoinGameByPin,
    PlayerStats,
    PlayerSummary,
    SettlementOut,
    TransferOut,
)
from backend.services.settlement import calculate_settlement

router = APIRouter(tags=["games"])


def _compute_player_stats(player: Player, chip_value: float) -> PlayerStats:
    buy_in_chips = sum(t.chips for t in player.transactions if t.type == "buy_in")
    cash_out_chips = sum(t.chips for t in player.transactions if t.type == "cash_out")
    chips_in_play = buy_in_chips - cash_out_chips

    money_spent = buy_in_chips * chip_value
    current_chips = player.actual_chips if player.actual_chips is not None else chips_in_play

    virtual_value = current_chips * chip_value
    cashed_out_value = cash_out_chips * chip_value
    net_balance = (virtual_value + cashed_out_value) - money_spent

    return PlayerStats(
        id=player.id,
        name=player.name,
        buy_in_chips=buy_in_chips,
        cash_out_chips=cash_out_chips,
        chips_in_play=chips_in_play,
        actual_chips=player.actual_chips,
        money_spent=money_spent,
        net_balance=net_balance,
    )


def _set_session_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=SESSION_COOKIE_MAX_AGE,
    )


def _serialize_game_out(game: Game, role: str | None = None) -> GameOut:
    return GameOut(
        id=game.id,
        name=game.name,
        pin=game.pin,
        chip_value=game.chip_value,
        big_blind_value=game.big_blind_value,
        status=game.status,
        session_role=role,
        created_at=game.created_at,
        closed_at=game.closed_at,
    )


@router.post("/games/", response_model=GameOut, status_code=201)
def create_game(body: GameCreate, request: Request, response: Response, db: Session = Depends(get_db)):
    game = Game(
        name=body.name,
        pin=generate_pin(db),
        chip_value=body.chip_value,
        big_blind_value=body.big_blind_value,
    )
    db.add(game)
    db.flush()

    token = issue_or_reuse_token(request)
    host_session = GameSession(token=token, game_id=game.id, player_id=None, role="host")
    db.add(host_session)

    db.commit()
    db.refresh(game)

    _set_session_cookie(response, token)
    return _serialize_game_out(game, role="host")


@router.post("/games/join", response_model=JoinGameOut)
def join_game_by_pin(body: JoinGameByPin, request: Request, response: Response, db: Session = Depends(get_db)):
    game = db.query(Game).filter(Game.pin == body.pin, Game.status == "active").first()
    if not game:
        raise HTTPException(
            status_code=404,
            detail={"error": "NotFound", "message": f"Active game with PIN {body.pin} not found"},
        )

    token = issue_or_reuse_token(request)
    existing_session = (
        db.query(GameSession)
        .filter(GameSession.token == token, GameSession.game_id == game.id)
        .first()
    )

    if existing_session:
        _set_session_cookie(response, token)
        return JoinGameOut(
            game=_serialize_game_out(game, role=existing_session.role),
            player=None,
        )

    player = Player(game_id=game.id, name=body.player_name.strip())
    db.add(player)
    db.flush()

    player_session = GameSession(token=token, game_id=game.id, player_id=player.id, role="player")
    db.add(player_session)
    db.commit()
    db.refresh(game)
    db.refresh(player)

    _set_session_cookie(response, token)
    return JoinGameOut(
        game=_serialize_game_out(game, role="player"),
        player=player,
    )


@router.get("/games/", response_model=list[GameOut])
def list_games(request: Request, db: Session = Depends(get_db)):
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if not token:
        return []

    sessions = db.query(GameSession).filter(GameSession.token == token).all()
    if not sessions:
        return []

    game_ids = [s.game_id for s in sessions]
    role_by_game = {s.game_id: s.role for s in sessions}
    games = db.query(Game).filter(Game.id.in_(game_ids)).order_by(Game.created_at.desc()).all()
    return [_serialize_game_out(game, role=role_by_game.get(game.id)) for game in games]


@router.get("/games/{game_id}", response_model=GameDetail)
def get_game(game_id: int, request: Request, db: Session = Depends(get_db)):
    session = require_game_session(db, request, game_id)

    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(
            status_code=404,
            detail={"error": "NotFound", "message": f"Game {game_id} not found"},
        )

    players_stats = [_compute_player_stats(p, game.chip_value) for p in game.players]
    return GameDetail(
        id=game.id,
        name=game.name,
        pin=game.pin,
        chip_value=game.chip_value,
        big_blind_value=game.big_blind_value,
        status=game.status,
        session_role=session.role,
        session_player_id=session.player_id,
        created_at=game.created_at,
        closed_at=game.closed_at,
        players=players_stats,
    )


@router.patch("/games/{game_id}", response_model=GameOut)
def update_game(game_id: int, body: GameUpdate, request: Request, db: Session = Depends(get_db)):
    require_game_session(db, request, game_id)

    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(
            status_code=404,
            detail={"error": "NotFound", "message": f"Game {game_id} not found"},
        )
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(game, field, value)
    db.commit()
    db.refresh(game)
    return _serialize_game_out(game)


@router.patch("/games/{game_id}/close", response_model=GameOut)
def close_game(game_id: int, request: Request, db: Session = Depends(get_db)):
    require_host_session(db, request, game_id)

    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(
            status_code=404,
            detail={"error": "NotFound", "message": f"Game {game_id} not found"},
        )
    if game.status == "closed":
        raise HTTPException(
            status_code=409,
            detail={"error": "Conflict", "message": "Game is already closed"},
        )

    game.status = "closed"
    game.closed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(game)
    return _serialize_game_out(game)


@router.delete("/games/{game_id}", status_code=204)
def delete_game(game_id: int, request: Request, db: Session = Depends(get_db)):
    require_host_session(db, request, game_id)

    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(
            status_code=404,
            detail={"error": "NotFound", "message": f"Game {game_id} not found"},
        )
    db.delete(game)
    db.commit()


@router.get("/games/{game_id}/settlement", response_model=SettlementOut)
def get_settlement(game_id: int, request: Request, db: Session = Depends(get_db)):
    require_game_session(db, request, game_id)

    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(
            status_code=404,
            detail={"error": "NotFound", "message": f"Game {game_id} not found"},
        )
    if game.status == "active":
        raise HTTPException(
            status_code=409,
            detail={
                "error": "Conflict",
                "message": "Cannot settle an active game. Close the game first.",
            },
        )

    stats = [_compute_player_stats(p, game.chip_value) for p in game.players]
    balances = {s.name: s.net_balance for s in stats}
    transfers = calculate_settlement(balances)

    return SettlementOut(
        player_summary=[
            PlayerSummary(
                id=s.id,
                name=s.name,
                money_spent=s.money_spent,
                final_value=s.net_balance + s.money_spent,
                profit_loss=s.net_balance,
            )
            for s in stats
        ],
        transfers=[
            TransferOut(
                from_player=t.from_player, to_player=t.to_player, amount=t.amount
            )
            for t in transfers
        ],
    )
