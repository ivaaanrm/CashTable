from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship

from backend.database import Base


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    chip_value = Column(Float, nullable=False, default=1.0)
    big_blind_value = Column(Float, nullable=True)
    status = Column(String, nullable=False, default="active")
    pin = Column(String(6), nullable=False, index=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    closed_at = Column(DateTime, nullable=True)

    players = relationship("Player", back_populates="game", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="game", cascade="all, delete-orphan")


class Player(Base):
    __tablename__ = "players"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    actual_chips = Column(Integer, nullable=True)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    game = relationship("Game", back_populates="players")
    transactions = relationship("Transaction", back_populates="player", cascade="all, delete-orphan")
    sessions = relationship("Session", back_populates="player")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id", ondelete="CASCADE"), nullable=False)
    player_id = Column(Integer, ForeignKey("players.id", ondelete="CASCADE"), nullable=False)
    type = Column(String, nullable=False)  # 'buy_in' | 'cash_out'
    chips = Column(Integer, nullable=False)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    player = relationship("Player", back_populates="transactions")


class Session(Base):
    __tablename__ = "sessions"
    __table_args__ = (UniqueConstraint("token", "game_id", name="uq_sessions_token_game"),)

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, nullable=False, index=True)
    game_id = Column(Integer, ForeignKey("games.id", ondelete="CASCADE"), nullable=False)
    player_id = Column(Integer, ForeignKey("players.id", ondelete="SET NULL"), nullable=True)
    role = Column(String, nullable=False)  # 'host' | 'player'
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    game = relationship("Game", back_populates="sessions")
    player = relationship("Player", back_populates="sessions")
