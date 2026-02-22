import os

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base

SQLALCHEMY_DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./cashtable.db")

connect_args = {}
if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def ensure_runtime_schema():
    inspector = inspect(engine)
    table_names = set(inspector.get_table_names())

    if "games" not in table_names:
        return

    game_columns = {column["name"] for column in inspector.get_columns("games")}
    if "pin" in game_columns:
        return

    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE games ADD COLUMN pin VARCHAR(6)"))
        rows = conn.execute(text("SELECT id FROM games ORDER BY id")).all()

        used: set[str] = set()
        for row in rows:
            game_id = row[0]
            candidate = str(100000 + (game_id % 900000))
            while candidate in used:
                candidate = str(((int(candidate) - 100000 + 1) % 900000) + 100000)
            used.add(candidate)
            conn.execute(
                text("UPDATE games SET pin = :pin WHERE id = :game_id"),
                {"pin": candidate, "game_id": game_id},
            )

        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_games_pin ON games (pin)"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
