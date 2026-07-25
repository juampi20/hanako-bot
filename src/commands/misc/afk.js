const { SlashCommandBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const { baseEmbed, COLORS } = require('../../utils/embed');
const AfkController = require('../../controllers/AfkController');

exports.run = (_client, _message, _args) => {
	// Slash-only command; prefix path is not supported
};

exports.data = new SlashCommandBuilder()
	.setName('afk')
	.setDescription('Marcarse como ausente (AFK)')
	.setContexts(InteractionContextType.Guild)
	.addSubcommand(subcommand =>
		subcommand
			.setName('set')
			.setDescription('Marcarse como AFK con un motivo')
			.addStringOption(option =>
				option
					.setName('reason')
					.setDescription('Motivo de la ausencia')
					.setRequired(false)
					.setMaxLength(200)),
	)
	.addSubcommand(subcommand =>
		subcommand
			.setName('list')
			.setDescription('Mostrar usuarios AFK'),
	)
	.addSubcommand(subcommand =>
		subcommand
			.setName('reset')
			.setDescription('Reiniciar AFK (admin)')
			.addUserOption(option =>
				option
					.setName('target')
					.setDescription('Usuario a reiniciar (opcional)')
					.setRequired(false)),
	);

exports.execute = async (client, interaction) => {
	const sub = interaction.options.getSubcommand();
	client.logger?.debug?.(`AFK: Inicio de comando sub=${sub} por ${interaction.user.tag} (${interaction.user.id})`);

	try {
		if (sub === 'set') {
			client.logger?.debug?.('AFK: Deferring reply (Ephemeral)...');
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });

			const reason = interaction.options.getString('reason') || 'Está ausente';

			await AfkController.setAfk(interaction.user.id, interaction.guildId, reason);

			client.logger?.debug?.('AFK: Estado AFK guardado exitosamente en afkService.');

			const embed = baseEmbed(client, { color: COLORS.INFO })
				.setTitle('💤 AFK')
				.setDescription(`Te marcaste como ausente.\n**Motivo:** ${reason}`)
				.setFooter({ text: 'Cuando vuelvas, envía un mensaje o únete a un canal de voz para desmarcarte.' });

			if (client.config.afkNotify && client.config.afkChannelId) {
				const channel = interaction.guild?.channels.cache.get(client.config.afkChannelId);
				if (channel) {
					client.logger?.debug?.(`AFK: Enviando notificación a canal afkChannelId=${client.config.afkChannelId}`);
					channel.send(`${interaction.member.displayName} se marcó como AFK · ${reason}`)
						.catch(err => client.logger?.debug?.(`AFK: Error al notificar en canal: ${err.message}`));
				}
			}

			client.logger?.debug?.('AFK: Editando respuesta efímera...');
			await interaction.editReply({ embeds: [embed] });
			client.logger?.debug?.('AFK: Respuesta editada con éxito.');
		}
		else if (sub === 'list') {
			client.logger?.debug?.('AFK: Deferring reply para list...');
			await interaction.deferReply();

			const users = await AfkController.getAfkUsers(interaction.guildId);

			if (users.length === 0) {
				return interaction.editReply({
					content: 'No hay usuarios actualmente AFK',
				});
			}

			const lines = users.slice(0, 25).map(r =>
				`<@${r.user_id}> — ${r.reason} · <t:${r.started_at}:R>`,
			);

			const embed = baseEmbed(client, { color: COLORS.INFO })
				.setTitle('💤 Usuarios AFK')
				.setDescription(lines.join('\n'));

			if (users.length > 25) {
				embed.setFooter({ text: `Mostrando los primeros 25 de ${users.length} usuarios AFK` });
			}

			await interaction.editReply({ embeds: [embed] });
		}
		else if (sub === 'reset') {
			client.logger?.debug?.('AFK: Deferring reply para reset...');
			await interaction.deferReply();

			await AfkController.resetAfk(interaction, interaction.guildId, client.config);
		}
	}
	catch (err) {
		client.logger?.debug?.(`AFK ERROR TRACE: ${err.stack || err.message}`);
		const embed = baseEmbed(client, { color: COLORS.ERROR })
			.setTitle('Error')
			.setDescription('Ocurrió un error al procesar el comando AFK.');
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