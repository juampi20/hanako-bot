.PHONY: start dev lint lint-fix test \
        build run stop clean \
        build-prod run-prod stop-prod \
        migrate migrate-dry backup

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
	docker compose build

run:
	docker compose up -d

stop:
	docker compose down

# ── Docker (producción — usa docker-compose.prod.yml) ──
build-prod:
	docker compose -f docker-compose.prod.yml build

run-prod:
	docker compose -f docker-compose.prod.yml up -d

stop-prod:
	docker compose -f docker-compose.prod.yml down

# ── Utilities ─────────────────────────────────────────
clean:
	rm -rf node_modules data

# PostgreSQL migration
migrate:
	node scripts/migrate-to-pg.cjs

migrate-dry:
	node scripts/migrate-to-pg.cjs --dry-run

# Database backup
backup:
	node scripts/backup-db.cjs
