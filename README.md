# hanako-bot

Sistema de niveles, recompensas por rol, detección de inactividad y moderación para Discord.

## Stack

discord.js v14 · Node.js · PostgreSQL · Express · Docker

## Quick Start

```bash
make setup       # crea .env desde .env.example
npm install
make dev         # nodemon con recarga automática
```

Con Docker: `docker compose up -d`

## Make

| Comando | Hace |
|---------|------|
| `make start` | Inicia el bot |
| `make dev` | nodemon (recarga automática) |
| `make test` | Jest |
| `make lint` | ESLint |
| `make backup` | backup de PostgreSQL |
| `make build` / `make run` / `make stop` | Docker compose |
