const { Client, Collection, GatewayIntentBits } = require('discord.js');

function createClient() {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
        ],
    });
    client.config = require('../config.js');
    client.logger = require('../logger.js');
    client.commands = new Collection();
    client.middleware = [];
    client.levelingService = null;
    client.interactions = new Collection();
    return client;
}

module.exports = { createClient };