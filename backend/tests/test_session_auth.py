from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.database import Base, get_db
from backend.routers import games, players, session, transactions


def make_app() -> FastAPI:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    app = FastAPI()
    app.include_router(games.router, prefix="/api")
    app.include_router(players.router, prefix="/api")
    app.include_router(transactions.router, prefix="/api")
    app.include_router(session.router, prefix="/api")

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    return app


def test_create_game_sets_cookie_and_pin():
    app = make_app()
    client = TestClient(app)

    res = client.post("/api/games/", json={"name": "Friday", "chip_value": 0.5})

    assert res.status_code == 201
    payload = res.json()
    assert payload["pin"].isdigit() and len(payload["pin"]) == 6
    assert payload["session_role"] == "host"
    assert "session_token" in client.cookies


def test_join_by_pin_creates_player_session_and_lists_only_joined_games():
    app = make_app()
    host = TestClient(app)
    player = TestClient(app)

    created = host.post("/api/games/", json={"name": "A", "chip_value": 1.0}).json()

    join_res = player.post("/api/games/join", json={"pin": created["pin"], "player_name": "Ana"})
    assert join_res.status_code == 200
    assert join_res.json()["game"]["session_role"] == "player"

    list_res = player.get("/api/games/")
    assert list_res.status_code == 200
    listed = list_res.json()
    assert len(listed) == 1
    assert listed[0]["id"] == created["id"]


def test_duplicate_join_same_cookie_reuses_existing_session():
    app = make_app()
    host = TestClient(app)
    player = TestClient(app)

    created = host.post("/api/games/", json={"name": "A", "chip_value": 1.0}).json()

    first = player.post("/api/games/join", json={"pin": created["pin"], "player_name": "John"})
    assert first.status_code == 200

    second = player.post("/api/games/join", json={"pin": created["pin"], "player_name": "Ignored"})
    assert second.status_code == 200

    detail = player.get(f"/api/games/{created['id']}")
    assert detail.status_code == 200
    assert len(detail.json()["players"]) == 1


def test_host_only_close_game():
    app = make_app()
    host = TestClient(app)
    player = TestClient(app)

    created = host.post("/api/games/", json={"name": "A", "chip_value": 1.0}).json()
    player.post("/api/games/join", json={"pin": created["pin"], "player_name": "Ana"})

    close_as_player = player.patch(f"/api/games/{created['id']}/close")
    assert close_as_player.status_code == 403

    close_as_host = host.patch(f"/api/games/{created['id']}/close")
    assert close_as_host.status_code == 200


def test_game_scoped_endpoint_requires_session():
    app = make_app()
    owner = TestClient(app)
    anonymous = TestClient(app)

    created = owner.post("/api/games/", json={"name": "A", "chip_value": 1.0}).json()

    unauthorized = anonymous.get(f"/api/games/{created['id']}")
    assert unauthorized.status_code == 401


def test_get_and_delete_session():
    app = make_app()
    # Need app.dependency_overrides logic if not in make_app, but make_app does it.
    client = TestClient(app)

    created = client.post("/api/games/", json={"name": "A", "chip_value": 1.0}).json()

    session_res = client.get("/api/session")
    assert session_res.status_code == 200
    assert session_res.json()["role"] == "host"

    delete_res = client.delete("/api/session")
    assert delete_res.status_code in (200, 204)

    session_after = client.get("/api/session")
    assert session_after.status_code == 200
    assert session_after.json() is None


def test_invalid_pin_join_fails():
    app = make_app()
    client = TestClient(app)
    
    join_res = client.post("/api/games/join", json={"pin": "000000", "player_name": "Ana"})
    assert join_res.status_code == 404


def test_host_only_delete_game():
    app = make_app()
    host = TestClient(app)
    player = TestClient(app)

    created = host.post("/api/games/", json={"name": "A", "chip_value": 1.0}).json()
    player.post("/api/games/join", json={"pin": created["pin"], "player_name": "Ana"})

    delete_as_player = player.delete(f"/api/games/{created['id']}")
    assert delete_as_player.status_code == 403

    delete_as_host = host.delete(f"/api/games/{created['id']}")
    assert delete_as_host.status_code == 204


def test_host_only_delete_player():
    app = make_app()
    host = TestClient(app)
    player = TestClient(app)

    created = host.post("/api/games/", json={"name": "A", "chip_value": 1.0}).json()
    join_res = player.post("/api/games/join", json={"pin": created["pin"], "player_name": "Ana"}).json()
    player_id = join_res["player"]["id"]

    delete_as_player = player.delete(f"/api/players/{player_id}")
    assert delete_as_player.status_code == 403

    delete_as_host = host.delete(f"/api/players/{player_id}")
    assert delete_as_host.status_code == 204
