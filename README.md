# hanako-bot

Un bot de Discord para leveling, roles por nivel, XP por voz y moderación, construido con discord.js v14 y SQLite.

## Stack

- **Runtime**: Node.js (CommonJS)
- **Framework**: discord.js v14
- **Base de datos**: SQLite via `node:sqlite`
- **Logs**: chalk

## Estructura

```
src/
├── index.js                       # Entry point
├── config/
│   └── bot.js                     # Config desde .env
├── utils/
│   ├── embed.js                   # baseEmbed + COLORS
│   ├── leveling.js                # assignLevelReward + notifyLevelUp (compartido)
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
│       ├── clientReady.js         # Inicialización DB + slash commands
│       ├── interactionCreate.js   # Slash command handler con middleware
│       ├── messageCreate.js       # XP automática por mensaje + level-up rewards
│       └── voiceStateUpdate.js    # XP automática por voz (10 XP / min)
├── handlers/
│   ├── functions.js               # Helpers de embed para comandos
│   └── loaders/
│       ├── commands.js            # Escaneo y registro de comandos
│       └── events.js              # Escaneo de eventos
├── middleware/
│   ├── cooldown.js                # Cooldown por usuario (priority 10)
│   ├── permissions.js             # Guard ownerOnly + moderatorOnly (priority 20)
│   └── errorBoundary.js           # Manejador de errores (priority 30)
├── commands/
│   ├── dev/eval.js
│   ├── fun/8ball.js
│   ├── leveling/
│   │   ├── rank.js                # /rank — progreso y posición
│   │   ├── leaderboard.js         # /leaderboard — top del servidor
│   │   ├── rewards.js             # /rewards — lista recompensas
│   │   ├── create-reward.js       # /create-reward — asignar rol a nivel
│   │   ├── delete-reward.js       # /delete-reward — eliminar recompensa
│   │   ├── set-xp.js              # /set-xp — setear XP (ownerOnly)
│   │   └── set-level.js           # /set-level — setear nivel (ownerOnly)
│   ├── misc/help.js, ping.js, say.js, beep.js
│   └── moderation/purge.js
└── __tests__/
    ├── leveling.test.js           # Tests de Score + Reward
    ├── slash.test.js              # Tests de comandos slash
    └── voice-xp.test.js           # Tests de XP por voz
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

## XP automática

- **Por mensaje**: XP aleatorio (15-25) por mensaje, cooldown de 1 minuto, fórmula Mee6.
- **Por voz**: 10 XP por minuto en canales de voz activos (configurable). No otorga XP si el usuario está muteado, ensordecido o en el canal AFK.
- Al subir de nivel asigna el rol correspondiente y remueve el anterior automáticamente.
- Las notificaciones de subida se envían al canal `LEVEL_UP_CHANNEL_ID` o al system channel del servidor.

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
| `MODERATOR_IDS` | IDs de moderadores separados por coma (acceso a comandos moderatorOnly) |
| `XP_MIN` | XP mínimo por mensaje (default 15) |
| `XP_MAX` | XP máximo por mensaje (default 25) |
| `LEVEL_UP_CHANNEL_ID` | Canal para notificaciones de subida de nivel |
| `DEV_GUILD_ID` | Guild ID para registro instantáneo de slash commands |
| `VOICE_XP_AMOUNT` | XP por intervalo de voz (default 10) |
| `VOICE_XP_INTERVAL` | Segundos entre awards de XP por voz (default 60) |
