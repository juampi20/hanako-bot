# hanako-bot

A Discord bot for leveling and moderation, built with discord.js v14.

## Structure

```
src/
├── index.js                  # Entry point
├── config.js / logger.js     # Configuration and logging
├── bot/
│   ├── client.js             # Client factory
│   └── bootstrap.js          # Startup: events → commands → middleware → login
├── events/
│   └── message.js            # Message handler with middleware pipeline
├── middleware/               # Pluggable pipeline
│   ├── 01-cooldown.js        # Per-user cooldown
│   ├── 02-permissions.js     # Owner-only guard
│   └── 03-errorBoundary.js   # Error handler
├── services/
│   ├── database.js           # SQLite singleton (node:sqlite)
│   └── leveling.js           # XP, scores, leaderboard logic
└── commands/                 # Command handlers
    ├── dev/eval.js
    ├── fun/8ball.js
    ├── leveling/rank.js, leaderboard.js, give.js
    ├── misc/help.js, ping.js, say.js, beep.js
    └── moderation/purge.js
```

## Quick start

```bash
cp .env.example .env    # edit with your token and owner ID
make start              # or: npm start
```

## Docker

```bash
make docker-build
make docker-run          # docker compose up -d
make docker-stop         # docker compose down
```

## Commands

```bash
make lint       # ESLint
make test       # Jest
make dev        # nodemon
```
