const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { baseEmbed, COLORS } = require('../../utils/embed');
const { Reward } = require('../../database/models');

exports.data = new SlashCommandBuilder()
	.setName('rewards')
	.setDescription('Lista las recompensas de rol de nivel configuradas')
	.setContexts(InteractionContextType.Guild);

exports.execute = async (client, interaction) => {
	const guildId = interaction.guild.id;

	const rewards = Reward.findAllByGuild(guildId);

	if (!rewards || rewards.length === 0) {
		return interaction.reply({ content: 'No hay recompensas configuradas para este servidor.', ephemeral: true });
	}

	const embed = baseEmbed(client, { color: COLORS.LEVELING })
		.setTitle('🎖️ Recompensas de Nivel')
		.setDescription(
			rewards.sort((a, b) => a.level - b.level).map(reward => {
				const role = interaction.guild.roles.cache.get(reward.role_id);
				const roleName = role ? role.toString() : `#${reward.role_id}`;
				return `#${reward.id} · Lv ${reward.level} · ${roleName}`;
			}).join('\n'),
		);

	await interaction.reply({ embeds: [embed] });
};

exports.help = {
	name: 'rewards',
	description: 'Ver recompensas de nivel configuradas.',
	category: 'leveling',
	usage: 'rewards',
	hintSlash: 'rewards',
	ownerOnly: false,
};