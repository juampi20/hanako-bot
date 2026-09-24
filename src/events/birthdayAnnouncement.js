const { baseEmbed, COLORS } = require('../utils/embed');
const BirthdayRepository = require('../database/repositories/BirthdayRepository');

const FIRST_CHECK_DELAY_MS = 10 * 1000;
const HOUR_INTERVAL_MS = 60 * 60 * 1000;

let intervalHandle = null;
const publishedToday = new Set();

function utcDateKey(now) {
	const year = now.getUTCFullYear();
	const month = String(now.getUTCMonth() + 1).padStart(2, '0');
	const day = String(now.getUTCDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

function localDateParts(timezone, now) {
	try {
		const formatted = new Intl.DateTimeFormat('en-CA', {
			timeZone: timezone,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
		}).format(now);
		const [year, month, day] = formatted.split('-').map(Number);
		return { year, month, day };
	}
	catch {
		return null;
	}
}

function getBirthdayMonthDay(birthday) {
	if (birthday instanceof Date) {
		return { month: birthday.getMonth() + 1, day: birthday.getDate() };
	}
	const [, month, day] = String(birthday).slice(0, 10).split('-').map(Number);
	return { month, day };
}

async function checkBirthdays(client) {
	if (!client.config.birthdayNotify || !client.config.birthdayChannelId) {
		return;
	}

	const channel = client.channels.cache.get(client.config.birthdayChannelId);
	if (!channel) {
		client.logger?.warn?.(`Birthday: canal de cumpleaños no encontrado (${client.config.birthdayChannelId})`);
		return;
	}

	const now = new Date();
	const today = utcDateKey(now);

	for (const key of publishedToday) {
		if (!key.endsWith(`:${today}`)) {
			publishedToday.delete(key);
		}
	}

	const pingEveryone = client.config.birthdayPingEveryone === true;
	const pingHere = client.config.birthdayPingHere === true;
	const pingRole = client.config.birthdayPingRole || null;
	const pingUser = client.config.birthdayPingUser === true;
	const birthdayRoleId = client.config.birthdayRole || null;

	client.logger?.debug?.(`Birthday: chequeo horario ${today}`);

	let birthdays;
	try {
		birthdays = await BirthdayRepository.getAll(client.config.guildId);
	}
	catch (err) {
		client.logger?.warn?.(`Birthday: falló la consulta de cumpleaños: ${err.message}`);
		return;
	}

	// Quién cumple hoy (en SU timezone) — map user_id -> record
	const celebrating = new Map();
	for (const record of birthdays) {
		const timezone = record.timezone || 'UTC';
		const local = localDateParts(timezone, now);
		if (!local) {
			client.logger?.debug?.(`Birthday: zona horaria inválida para ${record.user_id}: ${timezone}`);
			continue;
		}

		const { month: bmonth, day: bday } = getBirthdayMonthDay(record.birthday);
		if (bmonth === local.month && bday === local.day) {
			celebrating.set(record.user_id, record);
		}
	}

	// Remover rol de cumpleaños a quien ya no cumple hoy (fin del día o fecha cambiada)
	if (birthdayRoleId) {
		const role = channel.guild.roles.cache.get(birthdayRoleId);
		if (role) {
			for (const member of role.members.values()) {
				if (!celebrating.has(member.id)) {
					await member.roles.remove(role).catch(() => null);
				}
			}
		}
	}

	let published = 0;
	for (const [userId, record] of celebrating) {
		const member = await channel.guild.members.fetch(userId).catch(() => null);
		if (!member || member.user?.bot) {
			continue;
		}

		// Rol especial de cumpleaños: se asigna siempre durante el día, sin importar ping
		if (birthdayRoleId) {
			const role = channel.guild.roles.cache.get(birthdayRoleId);
			if (role && !member.roles.cache.has(role.id)) {
				await member.roles.add(role).catch(() => null);
			}
		}

		// ping:Si -> se publica el mensaje de felicitación; ping:No -> no se muestra
		if (!record.ping) {
			continue;
		}

		const key = `${userId}:${record.guild_id}:${today}`;
		if (publishedToday.has(key)) {
			continue;
		}

		const description = `¡Hoy cumple años <@${userId}>! 🥳`;
		const embed = baseEmbed(client, { color: COLORS.SUCCESS })
			.setTitle('🎂 ¡Feliz cumpleaños!')
			.setDescription(description);

		const content = [];
		if (pingEveryone) content.push('@everyone');
		if (pingHere) content.push('@here');
		if (pingRole) content.push(`<@&${pingRole}>`);
		if (pingUser) content.push(`<@${userId}>`);

		const payload = content.length > 0
			? { content: content.join(' '), embeds: [embed] }
			: { embeds: [embed] };

		await channel.send(payload).catch(() => null);
		publishedToday.add(key);
		published++;
	}

	if (published > 0) {
		client.logger?.log?.(`Birthday: ${published} felicitación(es) publicada(s)`);
	}
}

module.exports = async (client) => {
	if (intervalHandle) {
		clearInterval(intervalHandle);
	}

	setTimeout(() => {
		checkBirthdays(client)
			.catch(err => client.logger?.warn?.(`Birthday: falló el primer chequeo: ${err.message}`));
	}, FIRST_CHECK_DELAY_MS);

	intervalHandle = setInterval(() => {
		checkBirthdays(client)
			.catch(err => client.logger?.warn?.(`Birthday: falló el chequeo horario: ${err.message}`));
	}, HOUR_INTERVAL_MS);

	client.birthdayInterval = intervalHandle;
};
