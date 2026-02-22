from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.auth import get_current_user
from backend.database import Base, engine
from backend.routers import auth, games, players, transactions

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CashTable API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(games.router, prefix="/api", dependencies=[Depends(get_current_user)])
app.include_router(players.router, prefix="/api", dependencies=[Depends(get_current_user)])
app.include_router(transactions.router, prefix="/api", dependencies=[Depends(get_current_user)])
