'use strict';

/**
 * Guild settings schema and resolution.
 *
 * This module is the single source of truth for guild-scoped settings. Boot
 * secrets (CLIENT_TOKEN, API_KEY, GUILD_ID, API_PORT, OWNER_ID) are
 * deployment-only and live outside this schema.
 *
 * The schema is keyed by the same key used by the `guild_config` table (for
 * example 'afk-autoreply'). Each entry declares the environment variable it
 * can be seeded from, its value type, its default, the camelCase runtime key,
 * a human description, and the config-panel group.
 */

const SETTINGS = {
	// General
	'moderator-role': {
		env: 'MODERATOR_ROLE_ID',
		type: 'role',
		default: null,
		configKey: 'moderatorRoleId',
		description: 'Moderator role ID',
		group: 'General',
	},
	'auto-role': {
		env: 'AUTO_ROLE_ID',
		type: 'role',
		default: null,
		configKey: 'autoRoleId',
		description: 'Role assigned to new members',
		group: 'General',
	},

	// XP
	'chat-xp-min': {
		env: 'CHAT_XP_MIN',
		type: 'number',
		default: 15,
		configKey: 'chatXpMin',
		description: 'Minimum XP per chat message',
		group: 'XP',
	},
	'chat-xp-max': {
		env: 'CHAT_XP_MAX',
		type: 'number',
		default: 25,
		configKey: 'chatXpMax',
		description: 'Maximum XP per chat message',
		group: 'XP',
	},
	'voice-xp-min': {
		env: 'VOICE_XP_MIN',
		type: 'number',
		default: 3,
		configKey: 'voiceXpMin',
		description: 'Minimum XP per minute in voice',
		group: 'XP',
	},
	'voice-xp-max': {
		env: 'VOICE_XP_MAX',
		type: 'number',
		default: 5,
		configKey: 'voiceXpMax',
		description: 'Maximum XP per minute in voice',
		group: 'XP',
	},

	// Level-up
	'level-up-notify': {
		env: 'LEVEL_UP_NOTIFY',
		type: 'boolean',
		default: false,
		configKey: 'levelUpNotify',
		description: 'Enable level-up notifications',
		group: 'Level-up',
	},
	'level-up-interval': {
		env: 'LEVEL_UP_NOTIFY_INTERVAL',
		type: 'number',
		default: 5,
		configKey: 'levelUpNotifyInterval',
		description: 'Level-up notification interval',
		group: 'Level-up',
	},
	'level-up-channel': {
		env: 'LEVEL_UP_CHANNEL_ID',
		type: 'channel',
		default: null,
		configKey: 'levelUpChannel',
		description: 'Channel for level-up notifications',
		group: 'Level-up',
	},

	// AFK
	'afk-notify': {
		env: 'AFK_NOTIFY',
		type: 'boolean',
		default: false,
		configKey: 'afkNotify',
		description: 'Send AFK notifications',
		group: 'AFK',
	},
	'afk-autoreply': {
		env: 'AFK_AUTOREPLY',
		type: 'boolean',
		default: true,
		configKey: 'afkAutoReply',
		description: 'Auto-reply when mentioned AFK',
		group: 'AFK',
	},
	'afk-channel': {
		env: 'AFK_CHANNEL_ID',
		type: 'channel',
		default: null,
		configKey: 'afkChannelId',
		description: 'Channel for AFK notifications',
		group: 'AFK',
	},

	// Birthday
	'birthday-channel': {
		env: 'BIRTHDAY_CHANNEL_ID',
		type: 'channel',
		default: null,
		configKey: 'birthdayChannelId',
		description: 'Channel for birthday announcements',
		group: 'Birthday',
	},
	'birthday-notify': {
		env: 'BIRTHDAY_NOTIFY',
		type: 'boolean',
		default: false,
		configKey: 'birthdayNotify',
		description: 'Enable birthday announcements',
		group: 'Birthday',
	},
	'birthday-ping-everyone': {
		env: 'BIRTHDAY_PING_EVERYONE',
		type: 'boolean',
		default: false,
		configKey: 'birthdayPingEveryone',
		description: 'Mention @everyone in birthday announcements',
		group: 'Birthday',
	},
	'birthday-ping-here': {
		env: 'BIRTHDAY_PING_HERE',
		type: 'boolean',
		default: false,
		configKey: 'birthdayPingHere',
		description: 'Mention @here in birthday announcements',
		group: 'Birthday',
	},
	'birthday-ping-role': {
		env: 'BIRTHDAY_PING_ROLE',
		type: 'role',
		default: null,
		configKey: 'birthdayPingRole',
		description: 'Role to mention in birthday announcements',
		group: 'Birthday',
	},
	'birthday-ping-user': {
		env: 'BIRTHDAY_PING_USER',
		type: 'boolean',
		default: false,
		configKey: 'birthdayPingUser',
		description: 'Mention the celebrated user above the embed',
		group: 'Birthday',
	},
	'birthday-role': {
		env: 'BIRTHDAY_ROLE',
		type: 'role',
		default: null,
		configKey: 'birthdayRole',
		description: 'Role assigned to members on their birthday',
		group: 'Birthday',
	},
};

const SNOWFLAKE_PATTERN = /^\d{17,20}$/;

/**
 * Coerce a raw value to the given entry's type.
 * @param {object} entry - schema entry
 * @param {*} raw - raw db/env/user value
 * @returns {{ ok: true, value: * } | { ok: false, error: string }}
 */
function coerce(entry, raw) {
	switch (entry.type) {
	case 'string': {
		const value = String(raw).trim();
		if (!value) return { ok: false, error: 'El valor no puede estar vacío.' };
		return { ok: true, value };
	}
	case 'number': {
		const value = Number(raw);
		if (!Number.isInteger(value)) return { ok: false, error: 'Debe ser un número entero.' };
		if (value < 1) return { ok: false, error: 'Debe ser mayor o igual a 1.' };
		return { ok: true, value };
	}
	case 'boolean': {
		if (raw === 'true' || raw === true) return { ok: true, value: true };
		if (raw === 'false' || raw === false) return { ok: true, value: false };
		return { ok: false, error: 'Debe ser \'true\' o \'false\'.' };
	}
	case 'role':
	case 'channel': {
		const value = String(raw).trim();
		if (!SNOWFLAKE_PATTERN.test(value)) {
			return { ok: false, error: 'Debe ser un ID de Discord de 17-20 dígitos.' };
		}
		return { ok: true, value };
	}
	default:
		return { ok: false, error: `Tipo desconocido: ${entry.type}` };
	}
}

/**
 * Resolve a single entry applying source precedence db > env > default.
 * @param {string} key - schema key
 * @param {object} entry - schema entry
 * @param {object} dbValues - values keyed by schema key
 * @param {object} env - environment values keyed by env var name
 * @returns {*} resolved value
 */
function resolveEntry(key, entry, dbValues, env) {
	const candidates = [dbValues?.[key], env?.[entry.env]];
	for (const raw of candidates) {
		if (raw === undefined || raw === null || raw === '') continue;
		const result = coerce(entry, raw);
		if (result.ok) return result.value;
	}
	return entry.default;
}

/**
 * Build the default value for every setting, keyed by runtime config key.
 * @returns {object}
 */
function defaults() {
	const resolved = {};
	for (const entry of Object.values(SETTINGS)) {
		resolved[entry.configKey] = entry.default;
	}
	return resolved;
}

/**
 * Resolve every setting, keyed by runtime config key.
 * @param {object} [dbValues] - values keyed by schema key (guild_config)
 * @param {object} [env] - environment values keyed by env var name
 * @returns {object}
 */
function resolve(dbValues, env) {
	const resolved = {};
	for (const [key, entry] of Object.entries(SETTINGS)) {
		resolved[entry.configKey] = resolveEntry(key, entry, dbValues, env);
	}
	return resolved;
}

/**
 * Validate and coerce a single setting value.
 * @param {string} key - schema key
 * @param {*} value - raw value
 * @returns {*} coerced value
 * @throws {Error} when the key is unknown or the value is invalid
 */
function validate(key, value) {
	const entry = SETTINGS[key];
	if (!entry) throw new Error(`Clave '${key}' no existe.`);

	const result = coerce(entry, value);
	if (!result.ok) throw new Error(result.error);
	return result.value;
}

/**
 * List every schema key.
 * @returns {string[]}
 */
function keys() {
	return Object.keys(SETTINGS);
}

module.exports = { defaults, resolve, validate, keys };
