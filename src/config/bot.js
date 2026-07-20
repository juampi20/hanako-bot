require('dotenv').config();

function toBool(value) {
	return value?.toLowerCase() === 'true';
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

	colors: COLORS,
};

if (!config.guildId) {
	throw new Error('GUILD_ID is required — this bot only works on a single guild.');
}

module.exports = config;
