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
    xpMin: parseInt(process.env.XP_MIN, 10) || 15,
    xpMax: parseInt(process.env.XP_MAX, 10) || 25,
    levelUpChannel: process.env.LEVEL_UP_CHANNEL_ID || null,
    devGuildId: process.env.DEV_GUILD_ID || null,
    colors: COLORS,
};

module.exports = config;
