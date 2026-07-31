const { SlashCommandBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const { baseEmbed, COLORS } = require('../../utils/embed');
const BirthdayRepository = require('../../database/repositories/BirthdayRepository');

const BIRTHDAY_REGEX = /^\d{2}-\d{2}-\d{4}$/;

function parseBirthday(raw) {
	if (!BIRTHDAY_REGEX.test(raw)) {
		return { ok: false, error: 'Formato de fecha inválido. Usá el formato dd-mm-yyyy (ej: 17-06-2002).' };
	}
	const [day, month, year] = raw.split('-').map(Number);
	const date = new Date(`${year}-${month}-${day}`);
	if (Number.isNaN(date.getTime())) {
		return { ok: false, error: 'Fecha inválida. Comprobá que el día y el mes existan.' };
	}
	if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) {
		return { ok: false, error: 'Fecha inválida. Por ejemplo, 31-02-2020 no existe.' };
	}
	return { ok: true, iso: date.toISOString().slice(0, 10) };
}

function formatDisplayDate(iso) {
	const [year, month, day] = iso.split('-');
	return `${day}-${month}-${year}`;
}

exports.run = (_client, _message, _args) => {
	// Slash-only command; prefix path is not supported
};

exports.data = new SlashCommandBuilder()
	.setName('birthday')
	.setDescription('Registrar y consultar cumpleaños')
	.setContexts(InteractionContextType.Guild)
	.addSubcommand(subcommand =>
		subcommand
			.setName('set')
			.setDescription('Registrar tu cumpleaños')
			.addStringOption(option =>
				option
					.setName('date')
					.setDescription('Tu fecha de nacimiento en formato dd-mm-yyyy')
					.setRequired(true)),
	)
	.addSubcommand(subcommand =>
		subcommand
			.setName('list')
			.setDescription('Mostrar los cumpleaños del servidor'),
	)
	.addSubcommand(subcommand =>
		subcommand
			.setName('remove')
			.setDescription('Eliminar tu cumpleaños registrado'),
	);

exports.execute = async (client, interaction) => {
	if (interaction.user.bot) {
		return client.errNormal({ error: 'los bots no pueden setear cumpleaños', type: 'ephemeral' }, interaction);
	}

	const sub = interaction.options.getSubcommand();
	client.logger?.debug?.(`Birthday: comando sub=${sub} por ${interaction.user.tag} (${interaction.user.id})`);

	try {
		if (sub === 'set') {
			const raw = interaction.options.getString('date');
			const parsed = parseBirthday(raw);
			if (!parsed.ok) {
				return client.errNormal({ error: parsed.error, type: 'ephemeral' }, interaction);
			}

			client.logger?.debug?.('Birthday: Deferring reply (Ephemeral)...');
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });

			await BirthdayRepository.set(interaction.user.id, interaction.guildId, parsed.iso);

			client.logger?.debug?.('Birthday: cumpleaños guardado exitosamente.');

			return client.succNormal({
				text: `¡Listo! Tu cumpleaños quedó registrado como **${formatDisplayDate(parsed.iso)}**. 🎂`,
				type: 'editreply',
			}, interaction);
		}
		else if (sub === 'list') {
			client.logger?.debug?.('Birthday: Deferring reply para list...');
			await interaction.deferReply();

			const birthdays = await BirthdayRepository.getAll(interaction.guildId);

			if (birthdays.length === 0) {
				return interaction.editReply({
					content: 'Todavía no hay cumpleaños registrados en este servidor.',
				});
			}

			const lines = birthdays.slice(0, 25).map(r =>
				`<@${r.user_id}> — ${formatDisplayDate(r.birthday)}`,
			);

			const embed = baseEmbed(client, { color: COLORS.INFO })
				.setTitle('🎂 Cumpleaños del servidor')
				.setDescription(lines.join('\n'));

			if (birthdays.length > 25) {
				embed.setFooter({ text: `Mostrando los primeros 25 de ${birthdays.length} cumpleaños` });
			}

			return interaction.editReply({ embeds: [embed] });
		}
		else if (sub === 'remove') {
			client.logger?.debug?.('Birthday: Deferring reply para remove...');
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });

			const removed = await BirthdayRepository.remove(interaction.user.id);

			if (!removed) {
				return client.errNormal({ error: 'No tenés un cumpleaños registrado.', type: 'editreply' }, interaction);
			}

			client.logger?.debug?.('Birthday: cumpleaños eliminado exitosamente.');

			return client.succNormal({
				text: 'Tu cumpleaños fue eliminado.',
				type: 'editreply',
			}, interaction);
		}
	}
	catch (err) {
		client.logger?.debug?.(`Birthday ERROR TRACE: ${err.stack || err.message}`);
		const embed = baseEmbed(client, { color: COLORS.ERROR })
			.setTitle('Error')
			.setDescription('Ocurrió un error al procesar el comando de cumpleaños.');
		await interaction.editReply({ embeds: [embed] }).catch(() => null);
	}
};

exports.help = {
	name: 'birthday',
	description: 'Registrar, consultar y eliminar cumpleaños.',
	category: 'misc',
	usage: 'birthday set/list/remove',
	hintSlash: 'birthday',
};
