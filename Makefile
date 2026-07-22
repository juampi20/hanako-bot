.PHONY: start dev lint lint-fix test \
        build run stop clean \
        build-prod run-prod stop-prod \
        logs logs-prod restart restart-prod \
        ps ps-prod shell setup clean-docker \
        migrate migrate-dry backup

COMPOSE_DEV ?= docker compose
COMPOSE_PROD ?= docker compose -f docker-compose.prod.yml

# ── Development ────────────────────────────────────────
start:
	node src/index.js

dev:
	npx nodemon src/index.js

lint:
	npx eslint src/

lint-fix:
	npx eslint src/ --fix

test:
	npx jest

# ── Docker (dev — usa docker-compose.yml + .env) ──────
build:
	$(COMPOSE_DEV) build

run:
	$(COMPOSE_DEV) up -d

stop:
	$(COMPOSE_DEV) down

logs:
	$(COMPOSE_DEV) logs -f bot

restart:
	$(COMPOSE_DEV) restart bot

ps:
	$(COMPOSE_DEV) ps

shell:
	$(COMPOSE_DEV) exec bot sh

# ── Docker (producción — usa docker-compose.prod.yml) ────
build-prod:
	$(COMPOSE_PROD) build

run-prod:
	$(COMPOSE_PROD) up -d

stop-prod:
	$(COMPOSE_PROD) down

logs-prod:
	$(COMPOSE_PROD) logs -f bot

restart-prod:
	$(COMPOSE_PROD) restart bot

ps-prod:
	$(COMPOSE_PROD) ps

# ── Utilities ─────────────────────────────────────────
clean:
	rm -rf node_modules data

setup:
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "Created .env from .env.example. PLEASE UPDATE SECRETS!"; \
	else \
		echo ".env already exists, skipping."; \
	fi
	@if [ ! -f .env.production ]; then \
		cp .env.prod.example .env.production; \
		echo "Created .env.production from .env.prod.example. PLEASE UPDATE SECRETS!"; \
	else \
		echo ".env.production already exists, skipping."; \
	fi

clean-docker:
	docker compose down --remove-orphans
	docker system prune -f

# Database backup (PostgreSQL)
backup:
	node scripts/backup-db.cjs