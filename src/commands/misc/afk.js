const { SlashCommandBuilder, InteractionContextType } = require('discord.js');
const { baseEmbed, COLORS } = require('../../utils/embed');

exports.run = (_client, _message, _args) => {
	// Slash-only command; prefix path is not supported
};

exports.data = new SlashCommandBuilder()
	.setName('afk')
	.setDescription('Marcarse como ausente (AFK)')
	.setContexts(InteractionContextType.Guild)
	.addStringOption(option =>
		option.setName('reason')
			.setDescription('Motivo de la ausencia')
			.setRequired(false)
			.setMaxLength(200));

exports.execute = async (client, interaction) => {
	await interaction.deferReply();

	try {
		const reason = interaction.options.getString('reason') || 'Está ausente';
		const member = interaction.member;
		const nickname = member.nickname || member.user.username;
		const startedAt = Math.floor(Date.now() / 1000);

		client.afkService.set(
			interaction.user.id,
			interaction.guildId,
			reason,
			startedAt,
			nickname,
		);

		const embed = baseEmbed(client, { color: COLORS.INFO })
			.setTitle('💤 AFK')
			.setDescription(`Te marcaste como ausente.\n**Motivo:** ${reason}`)
			.setFooter({ text: 'Cuando vuelvas, envía un mensaje o únete a un canal de voz para desmarcarte.' });

		// Notify AFK channel if enabled
		if (client.config.afkNotify && client.config.afkChannelId) {
			const channel = interaction.guild?.channels.cache.get(client.config.afkChannelId);
			if (channel) {
				channel.send(`${member.displayName} se marcó como AFK · ${reason}`)
					.catch(() => null);
			}
		}

		await interaction.editReply({ embeds: [embed] });
	}
	catch (err) {
		client.logger?.debug?.(`AFK: /afk command error: ${err.message}`);
		const embed = baseEmbed(client, { color: COLORS.ERROR })
			.setTitle('Error')
			.setDescription('Ocurrió un error al procesar el comando AFK.');
		// best-effort fallback if editReply fails
		await interaction.editReply({ embeds: [embed] }).catch(() => null);
	}
};

exports.help = {
	name: 'afk',
	description: 'Marcarse como ausente (AFK).',
	category: 'misc',
	usage: 'afk [razón]',
	hintSlash: 'afk',
};