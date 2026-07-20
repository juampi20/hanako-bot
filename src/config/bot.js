require('dotenv').config();

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
    guildId: process.env.GUILD_ID || null,
    moderatorRoleId: process.env.MODERATOR_ROLE_ID || null,
    voiceXpMin: parseInt(process.env.VOICE_XP_MIN, 10) || 3,
    voiceXpMax: parseInt(process.env.VOICE_XP_MAX, 10) || 5,
    levelUpNotify: process.env.LEVEL_UP_NOTIFY === 'true',
    levelUpChannel: process.env.LEVEL_UP_CHANNEL_ID || null,
    levelUpNotifyInterval: parseInt(process.env.LEVEL_UP_NOTIFY_INTERVAL, 10) || 5,
    colors: COLORS,
};

module.exports = config;
