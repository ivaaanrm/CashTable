.PHONY: backend frontend dev test install docker docker-down

backend:
	uv run uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload

frontend:
	cd frontend && npm run dev -- --host 0.0.0.0

dev:
	@trap 'kill 0' SIGINT; \
	uv run uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload & \
	cd frontend && npm run dev -- --host 0.0.0.0

test:
	uv run pytest backend/tests/ -v

install:
	uv add fastapi "uvicorn[standard]" sqlalchemy
	uv add --dev pytest
	cd frontend && npm install

docker:
	docker compose up --build

docker-down:
	docker compose down
