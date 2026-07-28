const { SlashCommandBuilder, InteractionContextType, ButtonBuilder, ButtonStyle, ActionRowBuilder, ComponentType } = require('discord.js');
const { baseEmbed, COLORS } = require('../../utils/embed');

const PAGE_SIZE = 10;
const MEDALS = ['🥇', '🥈', '🥉'];

async function buildLeaderboardPage(client, guildId, page) {
	const offset = page * PAGE_SIZE;
	const [entries, total] = await Promise.all([
		client.levelController.getLeaderboard(guildId, PAGE_SIZE, offset),
		client.levelController.getLeaderboardCount(guildId),
	]);

	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
	const descriptionLines = entries.map((data, i) => {
		const rank = offset + i + 1;
		const prefix = rank <= 3 ? MEDALS[rank - 1] : `${rank}.`;
		return `${prefix} <@${data.user}> — ${data.points} pts (nivel ${data.level})`;
	});

	const embed = baseEmbed(client, { color: COLORS.LEVELING })
		.setTitle('🏆 Tabla de clasificación')
		.setAuthor({ name: client.user.username, iconURL: client.user.avatarURL() })
		.setDescription(descriptionLines.length > 0 ? descriptionLines.join('\n') : 'No hay datos aún.')
		.setFooter({ text: `Página ${page + 1} de ${totalPages} · ${total} usuarios` });

	return { embed, totalPages };
}

function buildButtons(page, totalPages) {
	const prev = new ButtonBuilder()
		.setCustomId('lb_prev')
		.setEmoji('⬅️')
		.setStyle(ButtonStyle.Secondary)
		.setDisabled(page <= 0);

	const next = new ButtonBuilder()
		.setCustomId('lb_next')
		.setEmoji('➡️')
		.setStyle(ButtonStyle.Secondary)
		.setDisabled(page >= totalPages - 1);

	return new ActionRowBuilder().addComponents(prev, next);
}

exports.run = async (client, message, _args) => {
	const { embed } = await buildLeaderboardPage(client, message.guild.id, 0);
	await message.channel.send({ embeds: [embed] });
};

exports.data = new SlashCommandBuilder()
	.setName('top')
	.setDescription('Muestra la tabla de clasificación del servidor')
	.setContexts(InteractionContextType.Guild);

exports.execute = async (client, interaction) => {
	const { embed, totalPages } = await buildLeaderboardPage(client, interaction.guild.id, 0);
	const row = buildButtons(0, totalPages);

	const msg = await interaction.reply({ embeds: [embed], components: totalPages > 1 ? [row] : [], fetchReply: true });

	if (totalPages <= 1) return;

	const collector = msg.createMessageComponentCollector({
		componentType: ComponentType.Button,
		time: 120_000,
	});

	let currentPage = 0;

	collector.on('collect', async (btnInt) => {
		if (btnInt.user.id !== interaction.user.id) {
			return btnInt.reply({ content: 'No podés cambiar páginas de otro usuario.', ephemeral: true });
		}

		currentPage = btnInt.customId === 'lb_next' ? currentPage + 1 : currentPage - 1;
		const pageData = await buildLeaderboardPage(client, interaction.guild.id, currentPage);
		const newRow = buildButtons(currentPage, pageData.totalPages);

		await btnInt.update({ embeds: [pageData.embed], components: [newRow] });
	});

	collector.on('end', async () => {
		const disabled = buildButtons(0, 0);
		disabled.components.forEach(b => b.setDisabled(true));
		await msg.edit({ components: [disabled] }).catch(() => null);
	});
};

exports.help = {
	name: 'top',
	description: 'Muestra el top 10 en nivel.',
	category: 'leveling',
	usage: 'top',
	hintSlash: 'top',
};
