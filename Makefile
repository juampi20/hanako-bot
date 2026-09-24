.PHONY: start dev lint lint-fix test \
        build run stop logs restart ps shell \
        clean clean-docker setup backup

COMPOSE_DEV ?= docker compose

# ── Development ────────────────────────────────────────
start:
	node .

dev:
	npx nodemon .

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

clean-docker:
	docker compose down --remove-orphans
	docker system prune -f

# Database backup (PostgreSQL)
backup:
	node scripts/backup-db.cjs
