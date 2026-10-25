const { SlashCommandBuilder, InteractionContextType } = require('discord.js');

exports.data = new SlashCommandBuilder()
	.setName('say')
	.setDescription('Hace que el bot diga algo')
	.addStringOption(opt => opt.setName('message').setDescription('Mensaje a repetir').setRequired(true))
	.setContexts(InteractionContextType.Guild);

exports.execute = async (client, interaction) => {
	const message = interaction.options.getString('message');
	try {
		await interaction.reply({ content: message, allowedMentions: { parse: [] } });
	}
	catch (error) {
		client.logger.log(error, 'error');
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'Error al enviar el mensaje.', ephemeral: true });
		}
		else {
			await interaction.reply({ content: 'Error al enviar el mensaje.', ephemeral: true });
		}
	}
};

exports.help = {
	name: 'say',
	description: 'Hanako-kun habla!',
	category: 'misc',
	usage: 'say <text>',
	moderatorOnly: true,
	hintSlash: 'say',
};