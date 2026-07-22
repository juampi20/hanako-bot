const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { baseEmbed, COLORS } = require('../../utils/embed');

const MEDALS = ['🥇', '🥈', '🥉'];

async function buildLeaderboard(client, guildId) {
	const top10 = await client.levelingService.getLeaderboard(guildId, 10);
	const descriptionLines = top10.map((data, i) => {
		const prefix = i < 3 ? MEDALS[i] : `${i + 1}.`;
		// Mention sin ping: dentro de un embed no genera notificación
		return `${prefix} <@${data.user}> — ${data.points} pts (nivel ${data.level})`;
	});

	const embed = baseEmbed(client, { color: COLORS.LEVELING })
		.setTitle('🏆 Tabla de clasificación')
		.setAuthor({ name: client.user.username, iconURL: client.user.avatarURL() })
		.setDescription(descriptionLines.length > 0 ? descriptionLines.join('\n') : 'No hay datos aún.');
	return embed;
}

exports.run = async (client, message, _args) => {
	const embed = await buildLeaderboard(client, message.guild.id);
	await message.channel.send({ embeds: [embed] });
};

exports.data = new SlashCommandBuilder()
	.setName('leaderboard')
	.setDescription('Muestra el top 10 del servidor')
	.setContexts(InteractionContextType.Guild);

exports.execute = async (client, interaction) => {
	const embed = await buildLeaderboard(client, interaction.guild.id);
	await interaction.reply({ embeds: [embed] });
};

exports.help = {
	name: 'leaderboard',
	description: 'Muestra el top 10 en nivel.',
	category: 'leveling',
	usage: 'leaderboard',
	hintSlash: 'leaderboard',
};
