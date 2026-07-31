require('dotenv').config();

function toBool(value) {
	return value?.toLowerCase() === 'true';
}

/**
 * Validate the bot configuration.
 * @returns {string[]} Array of error messages, empty if valid
 */
function validate() {
	const errors = [];

	if (!process.env.CLIENT_TOKEN) {
		errors.push('CLIENT_TOKEN is required');
	}

	if (!process.env.GUILD_ID) {
		errors.push('GUILD_ID is required');
	}

	if (!process.env.API_KEY) {
		errors.push('API_KEY is required');
	}

	if (!process.env.API_PORT) {
		errors.push('API_PORT is required');
	}
	else if (isNaN(parseInt(process.env.API_PORT, 10))) {
		errors.push('API_PORT must be a number');
	}

	return errors;
}

const COLORS = {
	info: 0x3498DB,
	success: 0x57F287,
	error: 0xED4245,
	warning: 0xFEE75C,
	leveling: 0x9B59B6,
	fun: 0x5865F2,
};

const config = {
	token: process.env.CLIENT_TOKEN,
	prefix: process.env.PREFIX,
	ownerID: process.env.OWNER_ID,
	guildId: process.env.GUILD_ID,
	moderatorRoleId: process.env.MODERATOR_ROLE_ID || null,
	chatXpMin: parseInt(process.env.CHAT_XP_MIN, 10) || 15,
	chatXpMax: parseInt(process.env.CHAT_XP_MAX, 10) || 25,
	voiceXpMin: parseInt(process.env.VOICE_XP_MIN, 10) || 3,
	voiceXpMax: parseInt(process.env.VOICE_XP_MAX, 10) || 5,
	levelUpNotify: toBool(process.env.LEVEL_UP_NOTIFY) || false,
	levelUpChannel: process.env.LEVEL_UP_CHANNEL_ID || null,
	levelUpNotifyInterval: parseInt(process.env.LEVEL_UP_NOTIFY_INTERVAL, 10) || 5,

	// AFK system
	afkNotify: toBool(process.env.AFK_NOTIFY) || false,
	afkAutoReply: toBool(process.env.AFK_AUTOREPLY) || false,
	afkChannelId: process.env.AFK_CHANNEL_ID || null,

	// Auto-role
	autoRoleId: process.env.AUTO_ROLE_ID || null,

	// Birthday
	birthdayChannelId: process.env.BIRTHDAY_CHANNEL_ID || null,
	birthdayNotify: toBool(process.env.BIRTHDAY_NOTIFY) || false,

	// REST API
	apiPort: parseInt(process.env.API_PORT, 10) || 3000,
	apiKey: process.env.API_KEY || null,

	colors: COLORS,
};

if (!config.guildId) {
	throw new Error('GUILD_ID is required — this bot only works on a single guild.');
}

module.exports = config;
module.exports.validate = validate;

const SETTINGS_REGISTRY = {
	'prefix':              { env: 'PREFIX', type: 'string', default: '!', description: 'Command prefix', configKey: 'prefix' },
	'chat-xp-min':         { env: 'CHAT_XP_MIN', type: 'number', default: 15, description: 'Minimum XP per chat message', configKey: 'chatXpMin' },
	'chat-xp-max':         { env: 'CHAT_XP_MAX', type: 'number', default: 25, description: 'Maximum XP per chat message', configKey: 'chatXpMax' },
	'voice-xp-min':        { env: 'VOICE_XP_MIN', type: 'number', default: 3, description: 'Minimum XP per minute in voice', configKey: 'voiceXpMin' },
	'voice-xp-max':        { env: 'VOICE_XP_MAX', type: 'number', default: 5, description: 'Maximum XP per minute in voice', configKey: 'voiceXpMax' },
	'level-up-notify':     { env: 'LEVEL_UP_NOTIFY', type: 'boolean', default: false, description: 'Enable level-up notifications', configKey: 'levelUpNotify' },
	'level-up-interval':   { env: 'LEVEL_UP_NOTIFY_INTERVAL', type: 'number', default: 5, description: 'Level-up notification interval', configKey: 'levelUpNotifyInterval' },
	'level-up-channel':    { env: 'LEVEL_UP_CHANNEL_ID', type: 'snowflake', default: null, description: 'Channel for level-up notifications', configKey: 'levelUpChannel' },
	'afk-notify':          { env: 'AFK_NOTIFY', type: 'boolean', default: false, description: 'Send AFK notifications', configKey: 'afkNotify' },
	'afk-autoreply':       { env: 'AFK_AUTOREPLY', type: 'boolean', default: true, description: 'Auto-reply when mentioned AFK', configKey: 'afkAutoReply' },
	'afk-channel':         { env: 'AFK_CHANNEL_ID', type: 'snowflake', default: null, description: 'Channel for AFK notifications', configKey: 'afkChannelId' },
	'moderator-role':      { env: 'MODERATOR_ROLE_ID', type: 'snowflake', default: null, description: 'Moderator role ID', configKey: 'moderatorRoleId' },
	'auto-role':           { env: 'AUTO_ROLE_ID', type: 'snowflake', default: null, description: 'Role assigned to new members', configKey: 'autoRoleId' },
	'birthday-channel':    { env: 'BIRTHDAY_CHANNEL_ID', type: 'snowflake', default: null, description: 'Channel for birthday announcements', configKey: 'birthdayChannelId' },
	'birthday-notify':     { env: 'BIRTHDAY_NOTIFY', type: 'boolean', default: false, description: 'Enable birthday announcements', configKey: 'birthdayNotify' },
};
module.exports.SETTINGS_REGISTRY = SETTINGS_REGISTRY;
