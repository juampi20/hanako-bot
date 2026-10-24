# Boot config and guild settings are separate, resolved from one schema

**Status**: accepted

Configuration was read from two parallel tables in `src/config/bot.js`: a plain object built from `process.env` with `||` fallbacks, and a `SETTINGS_REGISTRY` used by the config panel. They had already diverged: `afkAutoReply` defaulted to `false` in one and `true` in the other, and `prefix` had no fallback in the runtime object, silently disabling prefix commands. The panel also resolved missing values through the registry default while the runtime used the object's, so the panel could display a value the bot was not actually using.

We decided that the runtime and the panel must read from a **single settings schema**, with resolution order `DB > env > schema.default`. Deployment configuration and secrets (`CLIENT_TOKEN`, `API_KEY`, `GUILD_ID`, `API_PORT`, `OWNER_ID`) stay read-once-at-startup from the environment, outside the schema and outside the panel; only guild settings are schema-driven and panel-editable. The schema distinguishes `role` and `channel` from a generic `snowflake`, because the type selects the input component, not just the label.

## Considered Options

- **Keep two tables and add tests to keep them in sync**. Rejected: the drift is structural, and tests only cover the pairs you remember to write.
- **Fold secrets into the schema too**. Rejected: secrets must never reach the database or the panel.
- **A third `config.json` source**. Deferred: `.env` plus the database already cover every value the repo has today; a JSON layer can be added when non-secret, versioned static config actually exists.
