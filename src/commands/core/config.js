const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const ConfigUI = require('../../utils/ConfigUI');

exports.data = new SlashCommandBuilder()
	.setName('config')
	.setDescription('Open the interactive configuration panel')
	.setContexts(InteractionContextType.Guild);

exports.execute = async (client, interaction) => {
	const ui = new ConfigUI(client, interaction.guildId);
	await ui.sendConfigPanel(interaction);
};

exports.help = {
	name: 'config',
	description: 'Open the interactive configuration panel',
	ownerOnly: true,
	category: 'dev',
	usage: '/config',
	hintSlash: '/config',
};
