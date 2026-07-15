const Discord = require('discord.js');

function createClient() {
    const client = new Discord.Client();
    client.config = require('../config.js');
    client.logger = require('../logger.js');
    client.commands = new Discord.Collection();
    return client;
}

module.exports = { createClient };