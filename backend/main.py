from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import Base, engine, ensure_runtime_schema
from backend.routers import games, players, session, transactions

Base.metadata.create_all(bind=engine)
ensure_runtime_schema()

app = FastAPI(title="CashTable API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

app.include_router(games.router, prefix="/api")
app.include_router(players.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(session.router, prefix="/api")
