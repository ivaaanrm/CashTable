from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models import Game, Player, Transaction
from backend.schemas import TransactionCreate, TransactionOut

router = APIRouter(tags=["transactions"])


@router.post("/transactions/", response_model=TransactionOut, status_code=201)
def create_transaction(body: TransactionCreate, db: Session = Depends(get_db)):
    game = db.query(Game).filter(Game.id == body.game_id).first()
    if not game:
        raise HTTPException(
            status_code=404,
            detail={"error": "NotFound", "message": f"Game {body.game_id} not found"},
        )
    if game.status == "closed":
        raise HTTPException(
            status_code=409,
            detail={"error": "Conflict", "message": "Cannot add transactions to a closed game"},
        )

    player = db.query(Player).filter(Player.id == body.player_id).first()
    if not player:
        raise HTTPException(
            status_code=404,
            detail={"error": "NotFound", "message": f"Player {body.player_id} not found"},
        )
    if player.game_id != body.game_id:
        raise HTTPException(
            status_code=409,
            detail={"error": "Conflict", "message": "Player does not belong to the specified game"},
        )

    transaction = Transaction(
        game_id=body.game_id,
        player_id=body.player_id,
        type=body.type,
        chips=body.chips,
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)
    return transaction


@router.delete("/transactions/{transaction_id}", status_code=204)
def delete_transaction(transaction_id: int, db: Session = Depends(get_db)):
    transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
    if not transaction:
        raise HTTPException(
            status_code=404,
            detail={"error": "NotFound", "message": f"Transaction {transaction_id} not found"},
        )
    db.delete(transaction)
    db.commit()
