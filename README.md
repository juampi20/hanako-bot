# hanako-bot

Discord bot for my server. Made with discord.js v14 + SQLite.

## Quick start

```bash
cp .env.example .env
npm install
npm start
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` / `make start` | Start the bot |
| `npm run dev` / `make dev` | nodemon (development) |
| `npm test` / `make test` | Jest |
| `npm run lint` / `make lint` | ESLint |
| `make lint-fix` | ESLint --fix |
| `make build` | docker compose build |
| `make run` | docker compose up -d |
| `make stop` | docker compose down |
| `make clean` | Remove node_modules and data |
