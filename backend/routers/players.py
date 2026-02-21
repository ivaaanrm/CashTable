from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Game, Player
from backend.schemas import PlayerCreate, PlayerOut

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
