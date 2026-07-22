const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { baseEmbed, COLORS } = require('../../utils/embed');

exports.data = new SlashCommandBuilder()
	.setName('set-level')
	.setDescription('Establece el nivel de un usuario')
	.addUserOption(opt => opt.setName('user').setDescription('Usuario a modificar').setRequired(true))
	.addIntegerOption(opt => opt.setName('level').setDescription('Nivel a establecer').setRequired(true).setMinValue(1))
	.setContexts(InteractionContextType.Guild);

exports.execute = async (client, interaction) => {
	const target = interaction.options.getUser('user');
	const level = interaction.options.getInteger('level');

	const result = await client.levelingService.setLevel(target.id, interaction.guild.id, level);
	if (!result) {
		return interaction.reply({ content: 'Error al establecer nivel.', ephemeral: true });
	}

	const embed = baseEmbed(client, { color: COLORS.SUCCESS })
		.setThumbnail(target.displayAvatarURL())
		.setTitle('⬆️ Nivel establecido')
		.addFields(
			{ name: 'Usuario', value: `${target.username}`, inline: true },
			{ name: 'Nivel', value: `${result.level}`, inline: true },
			{ name: 'XP mínimo', value: `${result.points}`, inline: true },
		);

	await interaction.reply({ embeds: [embed] });
};

exports.help = {
	name: 'set-level',
	description: 'Establecer nivel de un usuario.',
	category: 'leveling',
	usage: 'set-level <user> <nivel>',
	ownerOnly: true,
	hintSlash: 'set-level',
};
