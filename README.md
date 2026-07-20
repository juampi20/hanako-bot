# hanako-bot

Discord bot for leveling, voice XP, role rewards, and moderation. Built with discord.js v14 and SQLite.

## Stack

- **Runtime**: Node.js (CommonJS)
- **Framework**: discord.js v14
- **Database**: SQLite via `node:sqlite`
- **Logs**: chalk

## Quick start

```bash
cp .env.example .env    # set token, owner ID, etc.
make build              # docker compose build
make run                # docker compose up -d
```

### Without Docker

```bash
npm install
cp .env.example .env
npm start
```

## Scripts

```bash
make test       # Jest
make lint       # ESLint
make dev        # nodemon (development)
```

## Environment variables

| Variable | Description |
|---|---|
| `CLIENT_TOKEN` | Discord bot token |
| `PREFIX` | Text command prefix |
| `OWNER_ID` | Discord user ID of the bot owner |
| `MODERATOR_IDS` | Comma-separated moderator user IDs |
| `CHAT_XP_MIN` | Min XP per message (default 15) |
| `CHAT_XP_MAX` | Max XP per message (default 25) |
| `LEVEL_UP_CHANNEL_ID` | Channel for level-up notifications |
| `DEV_GUILD_ID` | Guild ID for dev slash command registration |
| `VOICE_XP_AMOUNT` | XP per voice interval (default 4) |
| `VOICE_XP_INTERVAL` | Seconds between voice XP awards (default 60) |
