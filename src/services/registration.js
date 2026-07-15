const { REST, Routes } = require('discord.js');

async function registerGuildCommands(client) {
    const guildId = client.config.devGuildId;
    if (!guildId) {
        client.logger.log('DEV_GUILD_ID not set — skipping slash command registration', 'warn');
        return;
    }
    const commands = client.interactions
        .filter(cmd => cmd.data)
        .map(cmd => cmd.data.toJSON());

    const rest = new REST({ version: '14' }).setToken(client.config.token);
    await rest.put(Routes.applicationGuildCommands(client.user.id, guildId), { body: commands });
    client.logger.log(`Registered ${commands.length} guild commands`, 'ready');
}

module.exports = { registerGuildCommands };