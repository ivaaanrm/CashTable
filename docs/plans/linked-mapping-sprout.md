# CashTable — Plan de Implementación

## Contexto

El proyecto CashTable es una aplicación web mobile-first para gestionar partidas de cash game de póker entre amigos. Resuelve el problema de calcular automáticamente quién le debe dinero a quién al final de la partida, minimizando el número de transferencias. El proyecto está en blanco (solo un stub `main.py` de Python).

**Decisiones de diseño:**
- Host único (un dispositivo gestiona todo, no hay sync en tiempo real)
- Uso local (localhost, red WiFi local)
- FastAPI (backend) + React/Vite (frontend) + SQLite
- MVP mínimo: crear partida, buy-ins, cash-outs, liquidación + botón copiar para WhatsApp

---

## Stack técnico

| Capa | Tecnología |
|---|---|
| Backend | Python 3.12 + FastAPI + SQLAlchemy (sync) + SQLite |
| Frontend | React 18 + Vite + TailwindCSS + React Router v6 + TanStack Query |
| Tests | pytest (backend) |
| Dev | uvicorn --reload (backend), npm run dev (frontend) |

---

## Estructura de proyecto

```
CashTable/
├── backend/
│   ├── main.py              # FastAPI app + CORS + include routers
│   ├── database.py          # SQLAlchemy engine + SessionLocal + Base
│   ├── models.py            # ORM: Game, Player, Transaction
│   ├── schemas.py           # Pydantic: GameCreate, PlayerCreate, TransactionCreate, GameDetail, Settlement
│   ├── routers/
│   │   ├── games.py         # /games/ CRUD + /games/{id}/close
│   │   ├── players.py       # /games/{id}/players/ + /players/{id}
│   │   └── transactions.py  # /transactions/ + /transactions/{id}
│   ├── services/
│   │   └── settlement.py    # Algoritmo de liquidación (puro, sin dependencias de DB)
│   └── tests/
│       └── test_settlement.py
│
├── frontend/
│   ├── index.html
│   ├── vite.config.js       # proxy /api → localhost:8000
│   ├── tailwind.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx           # React Router routes
│       ├── api/
│       │   ├── games.js      # fetch wrappers para /api/games/
│       │   ├── players.js
│       │   └── transactions.js
│       ├── components/
│       │   ├── PlayerCard.jsx       # Card con nombre, fichas en juego, balance (verde/rojo)
│       │   ├── TransactionModal.jsx # FAB modal: buy-in / cash-out
│       │   ├── AddPlayerModal.jsx   # Modal añadir jugador
│       │   └── NewGameModal.jsx     # Modal nueva partida
│       └── pages/
│           ├── GameList.jsx         # / — lista de partidas
│           ├── GameDetail.jsx       # /games/:id — partida activa
│           └── Settlement.jsx       # /games/:id/settlement — liquidación
│
├── pyproject.toml           # deps backend (fastapi, uvicorn, sqlalchemy)
└── .python-version          # 3.12
```

---

## Modelo de datos (SQLAlchemy / SQLite)

### `games`
```
id          INTEGER PRIMARY KEY AUTOINCREMENT
name        TEXT NOT NULL
chip_value  REAL NOT NULL DEFAULT 1.0     -- € por ficha
status      TEXT NOT NULL DEFAULT 'active' -- 'active' | 'closed'
created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
closed_at   DATETIME NULL
```

### `players`
```
id          INTEGER PRIMARY KEY AUTOINCREMENT
game_id     INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE
name        TEXT NOT NULL
created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
```

### `transactions`
```
id          INTEGER PRIMARY KEY AUTOINCREMENT
game_id     INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE
player_id   INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE
type        TEXT NOT NULL   -- 'buy_in' | 'cash_out'
chips       INTEGER NOT NULL CHECK(chips > 0)
created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
```

**Campos derivados (calculados en backend, no almacenados):**
```
total_buy_in_chips    = SUM(chips WHERE type='buy_in')
total_cash_out_chips  = SUM(chips WHERE type='cash_out')
money_spent           = total_buy_in_chips × chip_value
chips_in_play         = total_buy_in_chips − total_cash_out_chips
net_balance           = chips_in_play × chip_value − money_spent
```

---

## API REST

```
# Partidas
POST   /api/games/                   → crear partida (name, chip_value)
GET    /api/games/                   → listar partidas
GET    /api/games/{id}               → detalle + jugadores + balances calculados
PATCH  /api/games/{id}/close         → cerrar partida (status='closed', closed_at=now)
DELETE /api/games/{id}               → borrar partida

# Jugadores
POST   /api/games/{id}/players/      → añadir jugador (name)
DELETE /api/players/{id}             → eliminar jugador (solo sin transacciones)

# Transacciones
POST   /api/transactions/            → registrar buy-in o cash-out
DELETE /api/transactions/{id}        → anular movimiento

# Liquidación
GET    /api/games/{id}/settlement    → calcular liquidación (solo partidas cerradas)
```

**Response `GET /api/games/{id}`:**
```json
{
  "id": 1,
  "name": "Viernes noche",
  "chip_value": 1.0,
  "status": "active",
  "created_at": "...",
  "players": [
    {
      "id": 1,
      "name": "Juan",
      "buy_in_chips": 100,
      "cash_out_chips": 0,
      "chips_in_play": 100,
      "money_spent": 100.0,
      "net_balance": 0.0
    }
  ]
}
```

**Response `GET /api/games/{id}/settlement`:**
```json
{
  "player_summary": [
    { "name": "Juan", "money_spent": 100.0, "final_value": 80.0, "profit_loss": -20.0 }
  ],
  "transfers": [
    { "from": "Juan", "to": "Carlos", "amount": 20.0 }
  ]
}
```

---

## Algoritmo de liquidación (`backend/services/settlement.py`)

```python
from dataclasses import dataclass

@dataclass
class Transfer:
    from_player: str
    to_player: str
    amount: float

def calculate_settlement(balances: dict[str, float]) -> list[Transfer]:
    """
    balances: nombre → net_balance (negativo=debe, positivo=le deben)
    Invariante: sum(balances.values()) ≈ 0
    Complejidad: O(n log n). Produce máximo n-1 transferencias.
    """
    debtors   = sorted([(n, -b) for n, b in balances.items() if b < -0.01],
                        key=lambda x: x[1], reverse=True)
    creditors = sorted([(n, b)  for n, b in balances.items() if b >  0.01],
                        key=lambda x: x[1], reverse=True)
    transfers = []
    i = j = 0
    while i < len(debtors) and j < len(creditors):
        debtor, debt     = debtors[i]
        creditor, credit = creditors[j]
        amount = min(debt, credit)
        transfers.append(Transfer(debtor, creditor, round(amount, 2)))
        debtors[i]   = (debtor,   debt   - amount)
        creditors[j] = (creditor, credit - amount)
        if debtors[i][1]   < 0.01: i += 1
        if creditors[j][1] < 0.01: j += 1
    return transfers
```

---

## Frontend — 3 pantallas

### Pantalla 1: Lista de partidas (`/`)
- Lista de `GameCard` con nombre, fecha, nº jugadores, badge activa/cerrada
- Botón "Nueva partida" → `NewGameModal` (campos: nombre, € por ficha)

### Pantalla 2: Partida activa (`/games/:id`)
- Header: nombre + chip_value + botón "Cerrar partida"
- Lista de `PlayerCard`: nombre, chips en juego, balance en tiempo real (verde/rojo)
- FAB "+" → `TransactionModal`:
  - Dropdown: seleccionar jugador
  - Toggle: Buy-in / Cash-out
  - Input: cantidad de fichas
- Botón inline "Añadir jugador" → `AddPlayerModal`
- TanStack Query: refetch automático tras cada mutación

### Pantalla 3: Liquidación (`/games/:id/settlement`)
- Tabla resumen por jugador: dinero aportado, valor final, ganancia/pérdida
- Lista de transferencias con icono → : "Juan → Carlos: 20.00€"
- Botón "Copiar para WhatsApp" → copia texto formateado al portapapeles:
  ```
  🃏 Viernes noche — Resultado final

  Juan paga 20€ a Carlos
  Marta paga 15€ a Pedro
  ```

---

## Tests unitarios (`backend/tests/test_settlement.py`)

Casos a cubrir:
1. Caso simple (2 jugadores: uno gana, uno pierde)
2. Múltiples deudores y acreedores (n=4)
3. Jugador con balance cero (no aparece en transferencias)
4. Todos los balances cero → lista vacía
5. Suma de balances no exactamente cero por flotantes (tolerancia 0.01)

---

## Orden de implementación

### Fase 1: Backend core
1. Instalar dependencias en `pyproject.toml`: `fastapi`, `uvicorn[standard]`, `sqlalchemy`
2. Crear `backend/database.py` — engine SQLite + `Base` + `get_db`
3. Crear `backend/models.py` — modelos `Game`, `Player`, `Transaction`
4. Crear `backend/schemas.py` — Pydantic schemas
5. Crear `backend/services/settlement.py` + `tests/test_settlement.py`
6. Crear `backend/routers/games.py`, `players.py`, `transactions.py`
7. Crear `backend/main.py` — FastAPI app + CORS + routers
8. Ejecutar tests: `pytest backend/tests/`

### Fase 2: Frontend core
1. Crear proyecto: `npm create vite@latest frontend -- --template react`
2. Instalar: `tailwindcss`, `react-router-dom`, `@tanstack/react-query`
3. Configurar proxy en `vite.config.js` (`/api` → `http://localhost:8000`)
4. Crear `src/api/` wrappers
5. Implementar `GameList`, `GameDetail`, `Settlement` pages
6. Implementar modales: `NewGameModal`, `TransactionModal`, `AddPlayerModal`
7. Implementar `PlayerCard` con colores dinámicos

### Fase 3: Integración y pulido
1. Probar flujo completo end-to-end
2. Ajustar estilos mobile-first en TailwindCSS
3. Botón "Copiar para WhatsApp"
4. Manejo de errores básico (toasts o mensajes inline)

---

## Verificación end-to-end

```bash
# 1. Levantar backend
cd backend && uvicorn main:app --reload
# Verificar: http://localhost:8000/docs (Swagger UI debe mostrar todos los endpoints)

# 2. Levantar frontend
cd frontend && npm run dev
# Verificar: http://localhost:5173

# 3. Flujo de prueba manual:
#    - Crear partida "Test" con chip_value=1.0
#    - Añadir jugadores: Juan, Carlos, Marta
#    - Juan: buy-in 100 fichas
#    - Carlos: buy-in 100 fichas
#    - Marta: buy-in 100 fichas
#    - Juan: cash-out 80 fichas (pierde 20€)
#    - Carlos: cash-out 120 fichas (gana 20€)
#    - Marta: cash-out 100 fichas (neutro)
#    - Cerrar partida
#    - Verificar: "Juan paga 20€ a Carlos"
#    - Copiar para WhatsApp

# 4. Ejecutar tests unitarios
pytest backend/tests/ -v
```

---

## Archivos a crear (desde cero)

- `backend/main.py` (reemplaza el stub actual)
- `backend/database.py`
- `backend/models.py`
- `backend/schemas.py`
- `backend/services/settlement.py`
- `backend/tests/__init__.py`
- `backend/tests/test_settlement.py`
- `backend/routers/__init__.py`
- `backend/routers/games.py`
- `backend/routers/players.py`
- `backend/routers/transactions.py`
- `frontend/` (proyecto Vite completo)
- `pyproject.toml` (actualizar con dependencias backend)
