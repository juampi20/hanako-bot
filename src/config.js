require('dotenv').config();

const config = {
    "token": process.env.CLIENT_TOKEN,
    "prefix": process.env.PREFIX,
    "ownerID": process.env.OWNER_ID,
    "xpMin": parseInt(process.env.XP_MIN, 10) || 15,
    "xpMax": parseInt(process.env.XP_MAX, 10) || 25,
    "levelUpChannel": process.env.LEVEL_UP_CHANNEL_ID || null,
    "devGuildId": process.env.DEV_GUILD_ID || null
};

module.exports = config;