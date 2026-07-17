module.exports = async (client, interaction) => {
    if (interaction.isChatInputCommand()) {
        const commandName = interaction.commandName;
        const cmd = client.interactions.get(commandName);
        if (!cmd) {
            return interaction.reply({ content: 'Unknown command', ephemeral: true });
        }
        
        client.logger.log(`${interaction.user.username} (${interaction.user.id}) ejecuto el comando ${cmd.help.name} en ${interaction.guild?.name || interaction.guild?.id || "DM"}`, "cmd");
        
        let index = 0;
        const next = async (context = interaction) => {
            const middleware = client.middleware[index++];
            if (!middleware) {
                await cmd.execute(client, interaction);
            } else {
                return middleware(client, context, cmd, next);
            }
        };
        
        next().catch(async (err) => {
            client.logger.log(err, "error");
            try {
                await interaction.reply({ content: 'An error occurred while executing this command.', ephemeral: true });
            } catch (e) {
                console.error('Error sending error response:', e);
            }
        });
    }
};