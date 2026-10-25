# Atajos de desarrollo. Tirá `make` para ver la lista.
.DEFAULT_GOAL := help

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
	docker run --rm --network infra-red -u "$$(id -u):$$(id -g)" -v "$(CURDIR):/app" -w /app node:22-alpine node scripts/backup-db.cjs

up:
	docker compose up -d

down:
	docker compose down

logs:
	docker compose logs -f bot
