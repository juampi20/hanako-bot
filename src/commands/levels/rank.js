const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { baseEmbed, COLORS } = require('../../utils/embed');
const { progressBar } = require('../../utils/progress');
const LevelRepository = require('../../database/repositories/LevelRepository');

async function buildRankEmbed(client, target, guildId) {
	const score = await LevelRepository.findByUser(target.id, guildId);
	if (!score || score.points === 0) {
		const embed = baseEmbed(client, { color: COLORS.LEVELING })
			.setAuthor({ name: target.username, iconURL: target.avatarURL() })
			.setDescription('Todavía no tenés XP registrado.')
			.addFields(
				{ name: 'Nivel', value: '1', inline: true },
				{ name: 'XP Total', value: '0', inline: true },
				{ name: 'Rank', value: '—', inline: true },
			);
		return embed;
	}

	const currentLevel = score.level;
	const currentXP = score.points;
	const xpForCurrent = LevelRepository.getXPForLevel(currentLevel);
	const xpForNext = LevelRepository.getXPForLevel(currentLevel + 1);
	const xpFloor = currentLevel <= 1 ? 0 : xpForCurrent;
	const xpIntoLevel = Math.max(0, currentXP - xpFloor);
	const xpNeeded = xpForNext - xpFloor;
	const leaderboard = await LevelRepository.getLeaderboard(guildId, 1000);
	const rank = leaderboard.findIndex(entry => entry.user === target.id) + 1;

	const bar = progressBar(xpIntoLevel, xpNeeded);
	const pct = xpNeeded > 0 ? Math.round((xpIntoLevel / xpNeeded) * 100) : 100;

	const embed = baseEmbed(client, { color: COLORS.LEVELING })
		.setAuthor({ name: target.username, iconURL: target.avatarURL() })
		.setDescription([
			`${bar}  ${pct}%`,
			`**${currentXP} / ${xpForNext}** XP hacia el nivel **${currentLevel + 1}**`,
		].join('\n'))
		.addFields(
			{ name: 'Nivel', value: `${currentLevel}`, inline: true },
			{ name: 'XP Total', value: `${currentXP}`, inline: true },
			{ name: 'Rank', value: rank > 0 ? `#${rank}` : '—', inline: true },
		);
	return embed;
}

exports.run = async (client, message, _args) => {
	const target = message.author;

	if (!client.config.guildId && message.guild.id !== client.guilds.cache.first()?.id) {
		if (message.channel && message.channel.reply) {
			return message.channel.reply({
				content: '⚠️ Este comando solo funciona en el servidor configurado como servidor de desarrollo. Configura `GUILD_ID` en tu archivo .env.',
				ephemeral: true,
			});
		}
		return;
	}

	const guildId = client.config.guildId || message.guild.id;
	const embed = await buildRankEmbed(client, target, guildId);
	await message.channel.send({ embeds: [embed] });
};

exports.execute = async (client, interaction) => {
	const target = interaction.options.getUser('user') || interaction.user;

	if (!client.config.guildId && interaction.guild.id !== client.guilds.cache.first()?.id) {
		await interaction.reply({
			content: '⚠️ Este comando solo funciona en el servidor configurado como servidor de desarrollo. Configura `GUILD_ID` en tu archivo .env.',
			ephemeral: true,
		});
		return;
	}

	const guildId = client.config.guildId || interaction.guild.id;
	const embed = await buildRankEmbed(client, target, guildId);
	await interaction.reply({ embeds: [embed] });
};

exports.data = new SlashCommandBuilder()
	.setName('rank')
	.setDescription('Muestra tu nivel y XP')
	.addUserOption(opt => opt.setName('user').setDescription('Usuario a consultar').setRequired(false))
	.setContexts(InteractionContextType.Guild);

exports.help = {
	name: 'rank',
	description: 'Ver los puntos y nivel.',
	category: 'leveling',
	usage: 'rank',
	hintSlash: 'rank',
};
