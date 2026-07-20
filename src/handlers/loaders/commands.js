const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

/**
 * Scan the commands directory and index all command files into
 * client.commands (prefix) and client.interactions (slash).
 */
function loadCommands(client) {
	const commandsDir = path.resolve(__dirname, '..', '..', 'commands');
	const folders = fs.readdirSync(commandsDir);

	for (const folder of folders) {
		const folderPath = path.join(commandsDir, folder);
		if (!fs.statSync(folderPath).isDirectory()) { continue; }

		const files = fs
			.readdirSync(folderPath)
			.filter((f) => f.endsWith('.js'));

		client.logger.log(
			`Cargando un total de ${files.length} comandos (${folder}).`,
			'log',
		);
		client.logger?.debug?.(`Commands: scanning folder ${folder} for ${files.length} files`);

		for (const file of files) {
			const props = require(path.join(folderPath, file));
			const commandName = file.split('.')[0];

			client.commands.set(commandName, props);
			if (props.data) {
				client.interactions.set(commandName, props);
			}
			client.logger?.debug?.(`Commands: loaded command ${commandName} from ${file}`);
		}
	}
}

/**
 * Register all slash commands with Discord via REST API.
 * Must be called after client.login() (needs client.user.id).
 */
async function registerSlashCommands(client) {
	const guildId = client.config.guildId;
	if (!guildId) {
		client.logger.log(
			'GUILD_ID not set — skipping slash command registration',
			'warn',
		);
		return;
	}

	const commands = client.interactions
		.filter((cmd) => cmd.data)
		.map((cmd) => cmd.data.toJSON());

	const rest = new REST({ version: '10' }).setToken(client.config.token);
	try {
		await rest.put(
			Routes.applicationGuildCommands(client.user.id, guildId),
			{ body: commands },
		);
		client.logger.log(
			`Registered ${commands.length} guild commands`,
			'ready',
		);
	}
	catch (err) {
		client.logger.warn(
			`Failed to register guild commands for ${guildId}: ${err.message || err}`,
		);
	}
}

module.exports = { loadCommands, registerSlashCommands };
