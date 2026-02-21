from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, field_validator


# --- Requests ---

class GameCreate(BaseModel):
    name: str
    chip_value: float = 1.0


class PlayerCreate(BaseModel):
    name: str


class TransactionCreate(BaseModel):
    game_id: int
    player_id: int
    type: Literal["buy_in", "cash_out"]
    chips: int

    @field_validator("chips")
    @classmethod
    def chips_must_be_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("chips must be greater than 0")
        return v


# --- Responses ---

class GameOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    chip_value: float
    status: str
    created_at: datetime
    closed_at: datetime | None


class PlayerStats(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    buy_in_chips: int
    cash_out_chips: int
    chips_in_play: int
    money_spent: float
    net_balance: float


class GameDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    chip_value: float
    status: str
    created_at: datetime
    closed_at: datetime | None
    players: list[PlayerStats]


class PlayerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    game_id: int
    name: str
    created_at: datetime


class TransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    game_id: int
    player_id: int
    type: str
    chips: int
    created_at: datetime


class TransferOut(BaseModel):
    from_player: str
    to_player: str
    amount: float


class PlayerSummary(BaseModel):
    id: int
    name: str
    net_balance: float


class SettlementOut(BaseModel):
    player_summary: list[PlayerSummary]
    transfers: list[TransferOut]
