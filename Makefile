# Atajos de desarrollo. Tirá `make` para ver la lista.
.DEFAULT_GOAL := help

# Git Bash en Windows reescribe rutas tipo /app a C:/...; esto lo desactiva.
export MSYS_NO_PATHCONV := 1

.PHONY: help setup check backup up down logs

help:
	@echo "setup   crea .env desde .env.example"
	@echo "check   lint + test (igual que el CI)"
	@echo "backup  backup de postgres"
	@echo "up      levanta el stack (docker compose up -d)"
	@echo "down    baja el stack"
	@echo "logs    logs del bot"

setup:
	@[ -f .env ] || { cp .env.example .env; echo "Creé .env desde .env.example; actualizá los secretos."; }

check:
	npx eslint src/
	npx jest

backup:
	mkdir -p backups
	docker compose run --rm --no-deps -u "$$(id -u):$$(id -g)" bot node scripts/backup-db.cjs

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f bot
