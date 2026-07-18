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
    moderatorIds: process.env.MODERATOR_IDS
        ? process.env.MODERATOR_IDS.split(',').map(id => id.trim())
        : [],
    xpMin: parseInt(process.env.XP_MIN, 10) || 15,
    xpMax: parseInt(process.env.XP_MAX, 10) || 25,
    levelUpChannel: process.env.LEVEL_UP_CHANNEL_ID || null,
    devGuildId: process.env.DEV_GUILD_ID || null,
    voiceXpInterval: parseInt(process.env.VOICE_XP_INTERVAL, 10) || 60,
    voiceXpAmount: parseInt(process.env.VOICE_XP_AMOUNT, 10) || 4,
    levelUpNotifyInterval: parseInt(process.env.LEVEL_UP_NOTIFY_INTERVAL, 10) || 5,
    colors: COLORS,
};

module.exports = config;
