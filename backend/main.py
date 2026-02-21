from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.database import Base, engine
from backend.routers import games, players, transactions

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CashTable API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(games.router, prefix="/api")
app.include_router(players.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
