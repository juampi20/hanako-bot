# hanako-bot

A single-guild Discord bot with a REST API: it runs leveling, rewards, AFK and birthday features for one Discord server, and exposes that data over HTTP.

## Language

**Setting**:
A guild-scoped configuration value a moderator can change from the config panel: XP rates, notification channels, roles.
_Avoid_: option, preference, config value

**Boot config**:
Deployment configuration and secrets read from the environment once at startup: bot token, API key, guild ID, port. Not editable at runtime.
_Avoid_: env config, secrets, environment

**Settings schema**:
The single source of truth describing every setting: its type, default, environment name, and group. Drives both the runtime settings and the config panel.
_Avoid_: registry, settings table, config table
