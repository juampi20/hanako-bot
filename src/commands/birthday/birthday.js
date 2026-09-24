const { SlashCommandBuilder, InteractionContextType, MessageFlags } = require('discord.js');
const { baseEmbed, COLORS } = require('../../utils/embed');
const BirthdayRepository = require('../../database/repositories/BirthdayRepository');
const { TIMEZONES, DEFAULT_TIMEZONES, isValidTimezone } = require('../../utils/timezones');

const MONTHS = [
	'enero',
	'febrero',
	'marzo',
	'abril',
	'mayo',
	'junio',
	'julio',
	'agosto',
	'septiembre',
	'octubre',
	'noviembre',
	'diciembre',
];

const BIRTHDAY_YEAR = 2000;

function validateDayMonth(day, month) {
	if (!Number.isInteger(month) || month < 1 || month > 12) {
		return { ok: false, error: 'Mes inválido. Elegí un mes del 1 al 12.' };
	}
	if (!Number.isInteger(day) || day < 1 || day > 31) {
		return { ok: false, error: 'Día inválido. Elegí un día del 1 al 31.' };
	}
	const date = new Date(Date.UTC(BIRTHDAY_YEAR, month - 1, day));
	if (date.getUTCFullYear() !== BIRTHDAY_YEAR || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
		return { ok: false, error: 'Fecha inválida. Ese día no existe en el mes elegido (ej: 31 de febrero).' };
	}
	return { ok: true };
}

function formatBirthday(day, month) {
	return `${day} de ${MONTHS[month - 1]}`;
}

function getBirthdayMonthDay(birthday) {
	if (birthday instanceof Date) {
		return { month: birthday.getMonth() + 1, day: birthday.getDate() };
	}
	const [, month, day] = String(birthday).slice(0, 10).split('-').map(Number);
	return { month, day };
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
			.addIntegerOption(option =>
				option
					.setName('dia')
					.setDescription('Día de tu cumpleaños (1-31)')
					.setMinValue(1)
					.setMaxValue(31)
					.setRequired(true))
			.addStringOption(option =>
				option
					.setName('mes')
					.setDescription('Mes de tu cumpleaños')
					.setRequired(true)
					.addChoices(...MONTHS.map((name, i) => ({ name, value: String(i + 1) }))))
			.addStringOption(option =>
				option
					.setName('timezone')
					.setDescription('Tu zona horaria (IANA, ej: America/Argentina/Mendoza)')
					.setAutocomplete(true)
					.setRequired(true))
			.addStringOption(option =>
				option
					.setName('ping')
					.setDescription('¿Querés que se publique tu felicitación en el canal de cumpleaños?')
					.setRequired(true)
					.addChoices(
						{ name: 'Si', value: 'Si' },
						{ name: 'No', value: 'No' },
					)),
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
			const day = interaction.options.getInteger('dia');
			const month = Number(interaction.options.getString('mes'));
			const timezone = interaction.options.getString('timezone');
			const ping = interaction.options.getString('ping') === 'Si';

			const validation = validateDayMonth(day, month);
			if (!validation.ok) {
				return client.errNormal({ error: validation.error, type: 'ephemeral' }, interaction);
			}

			if (!isValidTimezone(timezone)) {
				return client.errNormal({
					error: `Zona horaria inválida: \`${timezone}\`. Usá una zona IANA válida (ej: America/Argentina/Mendoza).`,
					type: 'ephemeral',
				}, interaction);
			}

			client.logger?.debug?.('Birthday: Deferring reply (Ephemeral)...');
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });

			const iso = `${BIRTHDAY_YEAR}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
			await BirthdayRepository.set(interaction.user.id, interaction.guildId, iso, timezone, ping);

			client.logger?.debug?.('Birthday: cumpleaños guardado exitosamente.');

			return client.succNormal({
				text: `¡Listo! Tu cumpleaños quedó registrado como **${formatBirthday(day, month)}** (${timezone}). ${ping ? 'Se publicará tu felicitación en el canal de cumpleaños. 🎂' : 'No se publicará tu felicitación en el canal.'}`,
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

			const sorted = birthdays
				.map(r => ({
					user_id: r.user_id,
					...getBirthdayMonthDay(r.birthday),
				}))
				.sort((a, b) => a.month - b.month || a.day - b.day);

			const lines = sorted.slice(0, 25).map(r =>
				`<@${r.user_id}> — ${formatBirthday(r.day, r.month)}`,
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

exports.autocomplete = async (client, interaction) => {
	try {
		const focused = interaction.options.getFocused(true);
		if (focused.name !== 'timezone') {
			return;
		}

		const query = String(focused.value || '').trim().toLowerCase();
		let choices;
		if (!query) {
			choices = DEFAULT_TIMEZONES.concat(TIMEZONES);
		}
		else {
			choices = TIMEZONES.filter(tz => tz.toLowerCase().includes(query));
		}

		return interaction.respond(choices.slice(0, 25).map(tz => ({ name: tz, value: tz })));
	}
	catch (err) {
		client.logger?.debug?.(`Birthday: autocomplete falló para timezone: ${err.message}`);
		return undefined;
	}
};

exports.MONTHS = MONTHS;
exports.validateDayMonth = validateDayMonth;

exports.help = {
	name: 'birthday',
	description: 'Registrar, consultar y eliminar cumpleaños.',
	category: 'misc',
	usage: 'birthday set/list/remove',
	hintSlash: 'birthday',
};
