from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Game, Player
from backend.schemas import (
    GameCreate,
    GameDetail,
    GameOut,
    GameUpdate,
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

    # money_spent = total historical investment
    money_spent = buy_in_chips * chip_value

    current_chips = (
        player.actual_chips if player.actual_chips is not None else chips_in_play
    )

    # net_balance = what they have now + what they already took out - what they put in
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


@router.post("/games/", response_model=GameOut, status_code=201)
def create_game(body: GameCreate, db: Session = Depends(get_db)):
    game = Game(name=body.name, chip_value=body.chip_value, big_blind_value=body.big_blind_value)
    db.add(game)
    db.commit()
    db.refresh(game)
    return game


@router.get("/games/", response_model=list[GameOut])
def list_games(db: Session = Depends(get_db)):
    return db.query(Game).all()


@router.get("/games/{game_id}", response_model=GameDetail)
def get_game(game_id: int, db: Session = Depends(get_db)):
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
        chip_value=game.chip_value,
        big_blind_value=game.big_blind_value,
        status=game.status,
        created_at=game.created_at,
        closed_at=game.closed_at,
        players=players_stats,
    )


@router.patch("/games/{game_id}", response_model=GameOut)
def update_game(game_id: int, body: GameUpdate, db: Session = Depends(get_db)):
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
    return game


@router.patch("/games/{game_id}/close", response_model=GameOut)
def close_game(game_id: int, db: Session = Depends(get_db)):
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
    return game


@router.delete("/games/{game_id}", status_code=204)
def delete_game(game_id: int, db: Session = Depends(get_db)):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(
            status_code=404,
            detail={"error": "NotFound", "message": f"Game {game_id} not found"},
        )
    db.delete(game)
    db.commit()


@router.get("/games/{game_id}/settlement", response_model=SettlementOut)
def get_settlement(game_id: int, db: Session = Depends(get_db)):
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
