const { SlashCommandBuilder, InteractionContextType, PermissionFlagsBits } = require('discord.js');
const { baseEmbed, COLORS } = require('../../utils/embed');
const LevelRepository = require('../../database/repositories/LevelRepository');

exports.data = new SlashCommandBuilder()
	.setName('delete-reward')
	.setDescription('Elimina una recompensa de rol')
	.addIntegerOption(opt => opt.setName('reward_id').setDescription('ID de la recompensa a eliminar').setRequired(true))
	.setContexts(InteractionContextType.Guild)
	.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

exports.execute = async (client, interaction) => {
	const rewardId = interaction.options.getInteger('reward_id');
	const guildId = interaction.guild.id;

	// Find reward by ID first to show in response
	const reward = await LevelRepository.findRewardById(rewardId);
	if (!reward) {
		return interaction.reply({ content: 'Recompensa no encontrada.', ephemeral: true });
	}

	// Verify guild ownership and delete
	const owned = await LevelRepository.verifyRewardOwnership(rewardId, guildId);
	if (!owned) {
		return interaction.reply({ content: 'Esta recompensa no pertenece a este servidor.', ephemeral: true });
	}

	await LevelRepository.deleteReward(rewardId);

	const role = interaction.guild.roles.cache.get(reward.role_id);
	const roleName = role ? role.name : `#${reward.role_id}`;

	const embed = baseEmbed(client, { color: COLORS.ERROR })
		.setTitle('🗑️ Rol desasignado')
		.addFields(
			{ name: 'ID de recompensa', value: rewardId.toString(), inline: true },
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
	usage: 'delete-reward <recompensa_id>',
	hintSlash: 'delete-reward',
	ownerOnly: false,
};
