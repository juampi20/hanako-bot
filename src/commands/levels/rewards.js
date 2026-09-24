const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { baseEmbed, COLORS } = require('../../utils/embed');
const LevelRepository = require('../../database/repositories/LevelRepository');

exports.data = new SlashCommandBuilder()
	.setName('rewards')
	.setDescription('Lista las recompensas de rol de nivel configuradas')
	.setContexts(InteractionContextType.Guild);

exports.execute = async (client, interaction) => {
	const guildId = interaction.guild.id;

	await interaction.deferReply();

	const rewards = await LevelRepository.findAllRewardsByGuild(guildId);

	const embed = baseEmbed(client, { color: COLORS.LEVELING })
		.setTitle('🏆 Rewards Roles');

	if (!rewards || rewards.length === 0) {
		embed.setDescription('No hay rewards configurados aún.');
	}
	else {
		const lines = rewards.map(r => {
			const role = interaction.guild.roles.cache.get(r.role_id);
			const roleDisplay = role ? `${role}` : `\`${r.role_id}\``;
			return `Level ${r.level} - ${roleDisplay}`;
		});
		embed.setDescription(`\`${rewards.length} reward${rewards.length !== 1 ? 's' : ''}\`\n${lines.join('\n')}`);
	}

	await interaction.editReply({ embeds: [embed] });
};

exports.help = {
	name: 'rewards',
	description: 'Ver recompensas de nivel configuradas.',
	category: 'leveling',
	usage: 'rewards',
	hintSlash: 'rewards',
	ownerOnly: false,
};
