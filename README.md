# hanako-bot

A Discord bot for leveling and moderation, built with discord.js v12.

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

## Run

```bash
npm install
npm start         # or: npm run dev (nodemon)
```

Requires Node.js 22+ and a `.env` file with `DISCORD_TOKEN` and `BOT_OWNER_ID`.
