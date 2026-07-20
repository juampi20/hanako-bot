const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { baseEmbed, COLORS } = require('../../utils/embed');

exports.data = new SlashCommandBuilder()
	.setName('set-xp')
	.setDescription('Establece los puntos de XP de un usuario')
	.addUserOption(opt => opt.setName('user').setDescription('Usuario a modificar').setRequired(true))
	.addIntegerOption(opt => opt.setName('amount').setDescription('Cantidad de XP a establecer').setRequired(true).setMinValue(0))
	.setContexts(InteractionContextType.Guild);

exports.execute = async (client, interaction) => {
	const target = interaction.options.getUser('user');
	const amount = interaction.options.getInteger('amount');

	const result = client.levelingService.setXP(target.id, interaction.guild.id, amount);
	if (!result) {
		return interaction.reply({ content: 'Error al establecer XP.', ephemeral: true });
	}

	const embed = baseEmbed(client, { color: COLORS.SUCCESS })
		.setThumbnail(target.displayAvatarURL())
		.setTitle('🎯 XP establecido')
		.addFields(
			{ name: 'Usuario', value: `${target.username}`, inline: true },
			{ name: 'XP establecido', value: `${result.points}`, inline: true },
			{ name: 'Nivel actual', value: `${result.level}`, inline: true },
		);

	await interaction.reply({ embeds: [embed] });
};

exports.help = {
	name: 'set-xp',
	description: 'Establecer XP de un usuario.',
	category: 'leveling',
	usage: 'set-xp <user> <xp>',
	ownerOnly: true,
	hintSlash: 'set-xp',
};
