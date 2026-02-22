# PIN-Based Session Auth Design

## Overview

Kahoot-style session system for CashTable. Users create a game (becoming the host) or join an existing game by entering a 6-digit PIN. Identity is tracked via a UUID session token stored in an HTTP-only cookie. Host has elevated privileges; players have full view with limited admin actions.

## Data Model

### New: `Session` table

| Column     | Type              | Notes                                |
|------------|-------------------|--------------------------------------|
| id         | Integer (PK)      |                                      |
| token      | String (UUID)     | Unique, indexed. Stored in cookie.   |
| game_id    | Integer (FK→Game) |                                      |
| player_id  | Integer (FK→Player) | Nullable (host may not be a player) |
| role       | String            | "host" or "player"                   |
| created_at | DateTime          | Auto-set to UTC                      |

### Modified: `Game` table

| Column | Type   | Notes                                         |
|--------|--------|-----------------------------------------------|
| pin    | String | 6-digit numeric, unique among active games, indexed |

No changes to Player or Transaction models.

## API Changes

### New endpoints

```
POST /api/games/join       → Join game by PIN + player name
                             Body: { pin, player_name }
                             Sets cookie: session_token=<uuid>
                             Returns: game data + player data

GET  /api/session           → Current session info
                             Returns: { game_id, role, player_id, game_name } or null

DELETE /api/session          → Clear session (leave game)
```

### Modified endpoints

| Endpoint                        | Change                                         |
|---------------------------------|------------------------------------------------|
| `POST /api/games/`             | Also generates PIN + creates host session + sets cookie |
| `GET /api/games/`              | Only returns games where caller has a session  |
| `PATCH /api/games/{id}/close`  | Host-only                                      |
| `DELETE /api/games/{id}`       | Host-only                                      |
| `DELETE /api/players/{id}`     | Host-only                                      |
| All game-scoped endpoints      | Require valid session for that game             |

### Auth dependencies (FastAPI)

- `get_current_session(request, db)` — reads `session_token` cookie, returns Session or None
- `require_session` — raises 401 if no session
- `require_host` — raises 403 if role != "host"

## PIN Logic

- 6-digit numeric (100000–999999)
- Auto-generated on game creation
- Unique among active (non-closed) games; closed game PINs can be reused
- Retry on collision (unlikely with ~900K codes)

## Frontend UX

### Landing page (`/`)

- **"Unirse con PIN"** section at the top: prominent 6-digit input + "Unirse" button
- Below: game list filtered to user's sessions only
- "Nueva partida" button opens NewGameModal (same as current)

### Create game flow

1. User clicks "Nueva partida" → NewGameModal
2. Backend returns game + PIN → cookie set
3. Redirect to `/games/:id`
4. PIN displayed prominently at top of GameDetail (copyable, shareable)

### Join game flow

1. User enters 6-digit PIN on landing page
2. If valid → name entry screen/modal
3. Submit → `POST /api/games/join` → cookie set → redirect to `/games/:id`
4. Player sees full game view

### GameDetail changes

- PIN displayed at top (for sharing)
- Role badge (host / player)
- Host-only buttons (close game, delete player) hidden for non-hosts
- All other functionality unchanged

### Session persistence

- Cookie persists across refreshes
- On app load: `GET /api/session` → if active session, show in game list
- Same cookie joining same game → return existing session (no duplicates)

## Edge Cases

- **Multiple games**: One user can have sessions in multiple games
- **PIN collisions**: Retry random generation until unique among active games
- **Closed games**: PIN no longer joinable; can be reused by future games
- **Session cleanup**: Sessions cascade-delete with game deletion
- **Duplicate join**: Same token + same game → return existing session
- **Host persistence**: Host session lasts until explicitly cleared or game deleted

## What stays the same

- All existing game logic (transactions, settlement, chip tracking)
- Player stats computation
- Settlement algorithm
- All existing UI components (adding role-based visibility only)
