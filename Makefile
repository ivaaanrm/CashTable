.PHONY: backend frontend dev test install

backend:
	uv run uvicorn backend.main:app --reload

frontend:
	cd frontend && npm run dev

dev:
	@trap 'kill 0' SIGINT; \
	uv run uvicorn backend.main:app --reload & \
	cd frontend && npm run dev

test:
	uv run pytest backend/tests/ -v

install:
	uv add fastapi "uvicorn[standard]" sqlalchemy
	uv add --dev pytest
	cd frontend && npm install
