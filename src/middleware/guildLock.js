const guildLock = async (client, context, command, next) => {
	// If guildId is not set, allow all guilds (backward compatibility)
	if (!client.config.guildId) {
		return next();
	}

	// Determine the context's guild ID
	let contextGuildId = null;

	// For interaction commands (slash commands, subcommands)
	if (context.guildId) {
		contextGuildId = context.guildId;
	}
	// For message commands (prefix commands)
	else if (context.guild && context.guild.id) {
		contextGuildId = context.guild.id;
	}

	// If no guild context (DM), reject (guild lock should only apply in guilds)
	if (!contextGuildId) {
		return deny(context, 'Este comando solo funciona en el servidor configurado');
	}

	// Check if the context's guild matches the configured devGuildId
	if (contextGuildId !== client.config.guildId) {
		return deny(context, 'Este comando solo funciona en el servidor configurado');
	}

	return next();
};

guildLock.priority = 25;
module.exports = guildLock;

function deny(context, content) {
	if (context.reply) {
		return context.reply({ content, ephemeral: true });
	}
	if (context.isReplied) {
		return context.send(content);
	}
	console.error(`[GuildLock] ${content}`);
}