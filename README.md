# hanako-bot

Un bot de Discord para leveling, roles por nivel y moderación, construido con discord.js v14 y SQLite.

## Stack

- **Runtime**: Node.js (CommonJS)
- **Framework**: discord.js v14
- **Base de datos**: SQLite via `node:sqlite`
- **Logs**: chalk + moment

## Estructura

```
src/
├── index.js                       # Entry point
├── config/
│   └── bot.js                     # Config desde .env
├── utils/
│   ├── embed.js                   # baseEmbed + COLORS
│   ├── logger.js                  # Logger con chalk
│   └── progress.js                # Progress bar utility
├── database/
│   ├── connect.js                 # SQLite singleton (WAL mode)
│   └── models/
│       ├── index.js               # Model registry
│       ├── Score.js               # XP, niveles, leaderboard
│       └── Reward.js              # Recompensas por nivel
├── events/
│   └── client/
│       ├── ready.js               # Inicialización DB + slash commands
│       ├── interactionCreate.js   # Slash command handler con middleware
│       └── messageCreate.js       # XP automática + level-up rewards
├── handlers/
│   ├── functions.js               # Helpers de embed para comandos
│   └── loaders/
│       ├── commands.js            # Escaneo y registro de comandos
│       └── events.js              # Escaneo de eventos
├── middleware/
│   ├── 01-cooldown.js             # Cooldown por usuario
│   ├── 02-permissions.js          # Guard ownerOnly
│   └── 03-errorBoundary.js        # Manejador de errores
└── commands/
    ├── dev/eval.js
    ├── fun/8ball.js
    ├── leveling/
    │   ├── rank.js                # /rank — progreso y posición
    │   ├── leaderboard.js         # /leaderboard — top del servidor
    │   ├── rewards.js             # /rewards — lista recompensas
    │   ├── create-reward.js       # /create-reward — asignar rol a nivel
    │   ├── delete-reward.js       # /delete-reward — eliminar recompensa
    │   ├── set-xp.js              # /set-xp — setear XP (ownerOnly)
    │   └── set-level.js           # /set-level — setear nivel (ownerOnly)
    ├── misc/help.js, ping.js, say.js, beep.js
    └── moderation/purge.js
```

## Comandos de leveling

| Comando | Descripción | Acceso |
|---|---|---|
| `/rank [user]` | Progreso, XP y posición en el servidor | Todos |
| `/leaderboard` | Top 10 del servidor | Todos |
| `/rewards` | Lista recompensas de rol configuradas | Todos |
| `/create-reward <level> <role>` | Asigna un rol a un nivel | Manage Roles |
| `/delete-reward <reward_id>` | Elimina una recompensa | Manage Roles |
| `/set-xp <user> <amount>` | Establece XP (sube o baja de nivel) | Owner |
| `/set-level <user> <level>` | Establece nivel (XP mínimo) | Owner |

El sistema otorga XP automáticamente por mensaje (cooldown 1 min) con fórmula Mee6. Al subir de nivel asigna el rol correspondiente y remueve el anterior automáticamente.

## Quick start

```bash
cp .env.example .env    # editar con token, owner ID, etc.
make build              # docker compose build
make run                # docker compose up -d
```

### Sin Docker

```bash
npm install
cp .env.example .env
npm start
```

## Scripts

```bash
make test       # Jest
make lint       # ESLint
make dev        # nodemon (desarrollo)
```

## Variables de entorno

| Variable | Descripción |
|---|---|
| `CLIENT_TOKEN` | Token del bot de Discord |
| `PREFIX` | Prefijo para comandos de texto |
| `OWNER_ID` | ID de Discord del owner |
| `XP_MIN` | XP mínimo por mensaje (default 15) |
| `XP_MAX` | XP máximo por mensaje (default 25) |
| `LEVEL_UP_CHANNEL_ID` | Canal para notificaciones de subida |
| `DEV_GUILD_ID` | Guild ID para registro instantáneo de slash commands |
