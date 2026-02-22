from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, field_validator


# --- Requests ---

class GameCreate(BaseModel):
    name: str
    chip_value: float = 1.0
    big_blind_value: float | None = None


class GameUpdate(BaseModel):
    big_blind_value: float | None = None

    @field_validator("big_blind_value")
    @classmethod
    def bb_must_be_positive(cls, v: float | None) -> float | None:
        if v is not None and v <= 0:
            raise ValueError("big_blind_value must be > 0")
        return v


class PlayerCreate(BaseModel):
    name: str


class JoinGameByPin(BaseModel):
    pin: str
    player_name: str

    @field_validator("pin")
    @classmethod
    def pin_must_be_six_digits(cls, v: str) -> str:
        if len(v) != 6 or not v.isdigit():
            raise ValueError("pin must be exactly 6 digits")
        return v

    @field_validator("player_name")
    @classmethod
    def player_name_must_not_be_empty(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("player_name cannot be empty")
        return v


class PlayerUpdateChips(BaseModel):
    actual_chips: int

    @field_validator("actual_chips")
    @classmethod
    def chips_must_be_non_negative(cls, v: int) -> int:
        if v < 0:
            raise ValueError("actual_chips must be >= 0")
        return v


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
    pin: str
    chip_value: float
    big_blind_value: float | None
    status: str
    session_role: str | None = None
    created_at: datetime
    closed_at: datetime | None


class PlayerStats(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    buy_in_chips: int
    cash_out_chips: int
    chips_in_play: int
    actual_chips: int | None
    money_spent: float
    net_balance: float


class GameDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    pin: str
    chip_value: float
    big_blind_value: float | None
    status: str
    session_role: str | None = None
    session_player_id: int | None = None
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


class JoinGameOut(BaseModel):
    game: GameOut
    player: PlayerOut | None = None


class TransferOut(BaseModel):
    from_player: str
    to_player: str
    amount: float


class PlayerSummary(BaseModel):
    id: int
    name: str
    money_spent: float
    final_value: float
    profit_loss: float


class SettlementOut(BaseModel):
    player_summary: list[PlayerSummary]
    transfers: list[TransferOut]


class SessionInfoOut(BaseModel):
    game_id: int
    role: str
    player_id: int | None
    game_name: str
