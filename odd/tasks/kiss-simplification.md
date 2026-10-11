# Feature: kiss-simplification

## Objective

Apply the settled architecture-review decisions to hanako-bot under the KISS principle: remove dead code, make configuration a single source of truth, and collapse the unused multi-guild dimension. No new layers, no new abstractions beyond one settings module.

## Problem / Why

The review (`/improve-codebase-architecture`) surfaced that the config is loaded from two parallel tables that have already diverged (`afkAutoReply` false vs true; `prefix` has no fallback, silently disabling prefix commands), the bot is single-guild by policy but multi-guild in shape (`guild_id` threaded through every repository), and a large amount of code is dead (`src/server/**` ~1,150 lines, `validateFields`, two unused model classes). The owner's stated principle: KISS — the bot serves one personal Discord server. Over-engineering (CSR, multi-guild) was already reverted once (PR #22/#23).

## Scope

In:
- Delete verified dead code.
- Single source of truth for settings (`src/config/settings.js`).
- Single-guild collapse of the data model and repositories.
- `TIMEZONES` derived from `Intl`.

Out (rejected as over-engineering):
- Re-splitting `LevelRepository` into Score/Reward repositories or any service/controller layer.
- A `VoiceXpTracker` module.
- An error-handling seam (the server is dead code).
- A `config.json` layer.

## Constraints

- KISS: prefer the smallest thing that works; one module is fine, a layer is not.
- Tabs (enforced by ESLint; husky pre-commit runs lint + test).
- UI copy stays Spanish; identifiers/comments/commits English.
- Testing: behavior and edges, no synthetic tests, no coverage obsession.
- Single-guild by design (ADR-0001).

## Tasks

### T1 — Delete dead code
- [ ] Delete `src/server/**` (server.js, middleware/, routes/, errors/, all its tests).
- [ ] Delete `src/server/middleware/validateFields.js` and `validateFields.test.js`.
- [ ] Delete `src/models/Event.js` and `src/models/SlashCommand.js`.
- Acceptance: no imports reference the deleted paths; full suite green.
- Checks: `npm test`, `npm run lint`.

### T2 — Config single source of truth
- [ ] Create `src/config/settings.js`: internal table; small interface `defaults()`, `resolve(raw)`, `validate(key, value)`, `keys()`; `env` injected; per-type parsing inside.
- [ ] Split boot config (env-only: CLIENT_TOKEN, API_KEY, GUILD_ID, API_PORT, OWNER_ID) from guild settings.
- [ ] Precedence `DB > env > schema.default`, all from the one table.
- [ ] `afkAutoReply` default `true`.
- [ ] Remove `prefix` entirely (slash-only): from the schema, from `ConfigUI` CATEGORIES, and the prefix branch in `messageCreate.js` + `help.js`.
- [ ] Refine `type` to `string`/`number`/`boolean`/`role`/`channel`; add `group`.
- [ ] `ConfigUI`: cosmetic only (emoji/color/order/label) + write DB then reload.
- Acceptance: runtime and panel read the same table; no setting can be invisible.
- Checks: `npm test` (`settings` unit tests + `sendConfigPanel`).

### T3 — Single-guild collapse
- [ ] Migrations: drop `guild_id` and redefine PKs — `guild_config(key)`, `afk(user_id)`, `birthdays(user_id)`, `scores(user PK, points)`, `level_rewards(level PK, role_id)`.
- [ ] Repositories lose the `guildId` parameter.
- [ ] Delete `guildIdMiddleware` and `req.guildId`.
- [ ] Voice sessions key by `userId` only.
- Acceptance: full suite green; bot starts with one `GUILD_ID`.
- Checks: `npm test`.

### T4 — TIMEZONES from Intl
- [ ] Derive the timezone list from `Intl.supportedValuesOf('timeZone')` plus the alias set.
- Acceptance: birthday timezone validation unchanged in behavior.
- Checks: `npm test -- --testPathPattern=birthday`.

## Acceptance Criteria

- All four tasks done; full suite green; ESLint clean.
- No dead references to deleted paths.
- One settings table drives both runtime and panel.

## Progress

- T1 done — commit cf6c81f. Dead code deleted; 89 tests green, lint clean.
- T2a done — commit e460549 (`settings.js` + tests).
- T2b done — commit 09e8da2 (wired bot.js / Bot.js / ConfigUI / messageCreate / help; deleted `validateSetting`). Single runtime object `client.config` (decision B). 103 tests green, lint clean.
- T2c (ConfigUI presentation split: cosmetic-only + drop dead `prefix` entry) — optional polish, pending.
- T3 single-guild — DONE (ALTER migrations verified against a real Postgres: old schema + data, run twice, zero data loss).
- T4 TIMEZONES — pending.

## Next Step

T1 first (lowest risk).
