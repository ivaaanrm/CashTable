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
            detail={
                "error": "Conflict",
                "message": "Cannot add transactions to a closed game",
            },
        )

    player = (
        db.query(Player).with_for_update().filter(Player.id == body.player_id).first()
    )
    if not player:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "NotFound",
                "message": f"Player {body.player_id} not found",
            },
        )
    if player.game_id != body.game_id:
        raise HTTPException(
            status_code=409,
            detail={
                "error": "Conflict",
                "message": "Player does not belong to the specified game",
            },
        )

    if body.type == "cash_out":
        buy_in = sum(t.chips for t in player.transactions if t.type == "buy_in")
        cash_out = sum(t.chips for t in player.transactions if t.type == "cash_out")
        chips_in_play = buy_in - cash_out
        current_chips = (
            player.actual_chips if player.actual_chips is not None else chips_in_play
        )

        if body.chips > current_chips:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "BadRequest",
                    "message": f"Cannot cash out {body.chips} chips — player only has {current_chips} available",
                },
            )

    # Auto-adjust actual_chips if it is set
    if player.actual_chips is not None:
        if body.type == "buy_in":
            player.actual_chips += body.chips
        elif body.type == "cash_out":
            player.actual_chips -= body.chips

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
    transaction = (
        db.query(Transaction)
        .with_for_update()
        .filter(Transaction.id == transaction_id)
        .first()
    )
    if not transaction:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "NotFound",
                "message": f"Transaction {transaction_id} not found",
            },
        )

    player = (
        db.query(Player)
        .with_for_update()
        .filter(Player.id == transaction.player_id)
        .first()
    )
    if player and player.actual_chips is not None:
        if transaction.type == "buy_in":
            player.actual_chips -= transaction.chips
        elif transaction.type == "cash_out":
            player.actual_chips += transaction.chips

    db.delete(transaction)
    db.commit()
