# PIN Authentication Design

**Date:** 2026-02-22
**Status:** Approved

## Context

CashTable is now publicly accessible via Traefik reverse proxy. All 14 API endpoints are currently open with no authentication. We need to lock down the entire app behind a single-admin PIN login.

## Requirements

- Single admin user (no registration, no user management)
- PIN code login (4-6 digits, mobile-friendly)
- All endpoints protected (full lockdown)
- 24-hour session expiry
- Stateless auth (no DB changes)

## Approach: JWT with PIN

PIN hash stored in `ADMIN_PIN_HASH` env var. On login, backend verifies PIN against bcrypt hash, returns a JWT signed with `SECRET_KEY`. Frontend stores token in `localStorage` and attaches it to every request.

## Backend

### New files

**`backend/auth.py`** — Core auth utilities:
- `verify_pin(plain_pin, hashed_pin)` — bcrypt verify
- `create_access_token(expires_delta=24h)` — JWT with `{"sub": "admin", "exp": ...}` signed with `SECRET_KEY`
- `get_current_user(token)` — FastAPI dependency using `OAuth2PasswordBearer`, decodes JWT, raises 401 if invalid/expired

**`backend/routers/auth.py`** — Login endpoint:
- `POST /api/auth/login` — accepts `{"pin": "1234"}`, returns `{"access_token": "...", "token_type": "bearer"}`
- Unprotected (only endpoint without auth)

### Modified files

**`backend/main.py`**:
- Include auth router (unprotected)
- Add `dependencies=[Depends(get_current_user)]` to all existing router `include_router()` calls

**`pyproject.toml`**:
- Add `python-jose[cryptography]`
- Add `passlib[bcrypt]`

## Frontend

### New files

**`src/auth.js`** — Token management:
- `getToken()` / `setToken(token)` / `clearToken()`
- `isAuthenticated()` — checks token exists and is not expired

**`src/pages/Login.jsx`** — PIN entry page:
- Numeric input with `inputmode="numeric"`
- Submit button
- Mobile-first, centered layout
- On success: store token, redirect to `/`

**`src/components/ProtectedRoute.jsx`** — Route guard:
- If no valid token, redirect to `/login`
- Wraps all existing routes

### Modified files

**`App.jsx`**:
- Add `/login` route (public)
- Wrap existing routes in `ProtectedRoute`

**`src/api/games.js`, `players.js`, `transactions.js`**:
- Add `Authorization: Bearer <token>` header to all `fetch()` calls
- On 401 response: clear token, redirect to `/login`

### Logout

Small logout button in the game list header. Clears token and redirects to `/login`.

## Configuration

**`.env.example`** updated:
```
ADMIN_PIN_HASH=<generated-bcrypt-hash>
SECRET_KEY=<random-secret-for-jwt-signing>
```

**Generate PIN hash:**
```bash
uv run python -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash(input('PIN: ')))"
```

## What does NOT change

- Database schema (no new tables, no migrations)
- Existing component logic
- Settlement algorithm
- Existing tests
