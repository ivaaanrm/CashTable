import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from passlib.hash import bcrypt

from backend.config import Settings, get_settings

TEST_PIN = "1234"
TEST_PIN_HASH = bcrypt.hash(TEST_PIN)

test_settings = Settings(
    database_url="sqlite:///./cashtable.db",
    secret_key="test-secret",
    admin_pin_hash=TEST_PIN_HASH,
)


@pytest.fixture()
def client():
    """Create a TestClient with a known PIN hash and secret key."""
    get_settings.cache_clear()

    with patch("backend.config.get_settings", return_value=test_settings):
        from backend.main import app
        yield TestClient(app)

    get_settings.cache_clear()


# ── Login endpoint ──────────────────────────────────────────────


def test_login_correct_pin(client):
    """POST /api/auth/login with correct PIN returns a token."""
    res = client.post("/api/auth/login", json={"pin": TEST_PIN})
    assert res.status_code == 200
    body = res.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"


def test_login_wrong_pin(client):
    """POST /api/auth/login with wrong PIN returns 401."""
    res = client.post("/api/auth/login", json={"pin": "0000"})
    assert res.status_code == 401
    assert res.json()["detail"] == "PIN incorrecto"


def test_login_empty_pin(client):
    """POST /api/auth/login with empty PIN returns 401."""
    res = client.post("/api/auth/login", json={"pin": ""})
    assert res.status_code == 401


# ── Protected routes ────────────────────────────────────────────


def test_protected_route_without_token(client):
    """GET /api/games/ without token returns 401/403."""
    res = client.get("/api/games/")
    assert res.status_code in (401, 403)


def test_protected_route_with_valid_token(client):
    """GET /api/games/ with valid token succeeds."""
    login_res = client.post("/api/auth/login", json={"pin": TEST_PIN})
    token = login_res.json()["access_token"]

    res = client.get("/api/games/", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200


def test_protected_route_with_invalid_token(client):
    """GET /api/games/ with garbage token returns 401/403."""
    res = client.get("/api/games/", headers={"Authorization": "Bearer garbage"})
    assert res.status_code in (401, 403)


def test_login_endpoint_is_not_protected(client):
    """The login endpoint itself must be accessible without a token."""
    res = client.post("/api/auth/login", json={"pin": "wrong"})
    # Should get 401 from bad PIN, not 403 from missing token
    assert res.status_code == 401
    assert res.json()["detail"] == "PIN incorrecto"
