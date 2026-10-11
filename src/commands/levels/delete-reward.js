const { SlashCommandBuilder, InteractionContextType, PermissionFlagsBits } = require('discord.js');
const { baseEmbed, COLORS } = require('../../utils/embed');
const LevelRepository = require('../../database/repositories/LevelRepository');

exports.data = new SlashCommandBuilder()
	.setName('delete-reward')
	.setDescription('Elimina una recompensa de rol')
	.addIntegerOption(opt => opt.setName('level').setDescription('Nivel de la recompensa a eliminar').setRequired(true).setMinValue(1))
	.setContexts(InteractionContextType.Guild)
	.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

exports.execute = async (client, interaction) => {
	const level = interaction.options.getInteger('level');

	// Find reward by level first to show in response
	const reward = await LevelRepository.findRewardByLevel(level);
	if (!reward) {
		return interaction.reply({ content: 'Recompensa no encontrada.', ephemeral: true });
	}

	await LevelRepository.deleteReward(level);

	const role = interaction.guild.roles.cache.get(reward.role_id);
	const roleName = role ? role.name : `#${reward.role_id}`;

	const embed = baseEmbed(client, { color: COLORS.ERROR })
		.setTitle('🗑️ Rol desasignado')
		.addFields(
			{ name: 'Nivel', value: `${reward.level}`, inline: true },
			{ name: 'Rol', value: roleName, inline: true },
		)
		.setFooter({ text: 'Recompensa eliminada correctamente.' });

	await interaction.reply({ embeds: [embed] });
};

exports.help = {
	name: 'delete-reward',
	description: 'Eliminar una asignación de rol de nivel.',
	category: 'leveling',
	usage: 'delete-reward <nivel>',
	hintSlash: 'delete-reward',
	ownerOnly: false,
};
