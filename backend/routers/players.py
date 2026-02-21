from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Game, Player, Transaction
from backend.schemas import PlayerCreate, PlayerOut, PlayerUpdateChips, TransactionOut

router = APIRouter(tags=["players"])


@router.post("/games/{game_id}/players/", response_model=PlayerOut, status_code=201)
def add_player(game_id: int, body: PlayerCreate, db: Session = Depends(get_db)):
    game = db.query(Game).filter(Game.id == game_id).first()
    if not game:
        raise HTTPException(status_code=404, detail={"error": "NotFound", "message": f"Game {game_id} not found"})
    if game.status == "closed":
        raise HTTPException(
            status_code=409,
            detail={"error": "Conflict", "message": "Cannot add a player to a closed game"},
        )

    player = Player(game_id=game_id, name=body.name)
    db.add(player)
    db.commit()
    db.refresh(player)
    return player


@router.patch("/players/{player_id}/chips", response_model=PlayerOut)
def update_player_chips(player_id: int, body: PlayerUpdateChips, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail={"error": "NotFound", "message": f"Player {player_id} not found"})
    game = db.query(Game).filter(Game.id == player.game_id).first()
    if game and game.status == "closed":
        raise HTTPException(
            status_code=409,
            detail={"error": "Conflict", "message": "Cannot update chips in a closed game"},
        )
    player.actual_chips = body.actual_chips
    db.commit()
    db.refresh(player)
    return player


@router.get("/players/{player_id}/transactions", response_model=list[TransactionOut])
def list_player_transactions(player_id: int, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail={"error": "NotFound", "message": f"Player {player_id} not found"})
    return (
        db.query(Transaction)
        .filter(Transaction.player_id == player_id)
        .order_by(Transaction.created_at.desc())
        .all()
    )


@router.delete("/players/{player_id}", status_code=204)
def delete_player(player_id: int, db: Session = Depends(get_db)):
    player = db.query(Player).filter(Player.id == player_id).first()
    if not player:
        raise HTTPException(status_code=404, detail={"error": "NotFound", "message": f"Player {player_id} not found"})
    if player.transactions:
        raise HTTPException(
            status_code=409,
            detail={"error": "Conflict", "message": "Cannot delete a player who has transactions"},
        )

    db.delete(player)
    db.commit()
