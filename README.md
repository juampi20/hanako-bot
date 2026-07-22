# hanako-bot

Discord bot para mi server. Hecho con discord.js v14 + PostgreSQL.

## Features

- **Leveling** — XP por mensajes y voz, leaderboard, rewards por nivel
- **Moderación** — purge
- **AFK** — detección y auto-reply
- **Misc** — ping, user info, server info, say, 8ball, help

## Entorno local

### Sin Docker (solo Node)

Necesitás una base PostgreSQL accesible. Copiá `.env.example` a `.env` y
completá `CLIENT_TOKEN`, `GUILD_ID`, etc. Ajustá `DATABASE_URL` si tu
PostgreSQL no corre en `localhost`.

```bash
make setup
npm install
make dev                # nodemon con recarga automática
```

### Con Docker (autocontenido)

El archivo `docker-compose.yml.example` incluye PostgreSQL — no necesita
infraestructura externa. Copialo a `docker-compose.yml` y levantalo:

```bash
cp docker-compose.yml.example docker-compose.yml
# editá .env con CLIENT_TOKEN, GUILD_ID, etc.
docker compose up -d
docker compose logs -f bot
```

> Si ya tenés tu propia infraestructura (ej: `infra-red` + `infra-postgres`),
> el `docker-compose.yml` del proyecto está configurado para tu red externa.

## Producción

Usá `.env.production` con las credenciales de tu DB cloud (Fly.io, Railway,
Neon, Supabase, etc.) y los tokens de Discord.

```bash
make build-prod && make run-prod
```

## Scripts

| Comando | Descripción |
|---------|-------------|
| `make setup` | Crear `.env` y `.env.production` desde ejemplos |
| `npm start` / `make start` | Iniciar bot |
| `npm run dev` / `make dev` | nodemon (desarrollo) |
| `npm test` / `make test` | Jest |
| `npm run lint` / `make lint` | ESLint |
| `make lint-fix` | ESLint --fix |
| `make backup` | Backup de PostgreSQL a `backups/` |
| `make build` / `make run` / `make stop` | Docker compose |
| `make build-prod` / `make run-prod` / `make stop-prod` | Docker compose (prod) |
