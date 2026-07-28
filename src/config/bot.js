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
