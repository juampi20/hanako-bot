# Single-guild bot

**Status**: accepted

hanako-bot serves exactly one Discord server. That was already enforced at runtime: `GUILD_ID` gates startup and every interaction (`Bot.js`), and slash commands are registered guild-scoped. But persistence and repositories were still shaped for many guilds: `guild_id` columns in `guild_config`, `afk`, `birthdays`, `levels` and `level_rewards`, a `guildId` argument threaded through every repository method, and per-guild voice-session keys. We collapsed the guild dimension entirely: tables drop `guild_id` and redefine their primary keys, repositories drop the argument, voice sessions key by user only, and the guild-lock middleware is removed. The `guild_id` seam only ever had one adapter, so carrying it everywhere was overhead, not design.

Reversing this means re-adding the column and re-threading the argument through every repository, which is exactly why it is recorded here.
