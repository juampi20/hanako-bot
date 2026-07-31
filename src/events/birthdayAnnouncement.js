const { baseEmbed, COLORS } = require('../utils/embed');
const BirthdayRepository = require('../database/repositories/BirthdayRepository');

const FIRST_CHECK_DELAY_MS = 10 * 1000;
const DAILY_INTERVAL_MS = 24 * 60 * 60 * 1000;

let intervalHandle = null;

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
	const month = now.getMonth() + 1;
	const day = now.getDate();

	client.logger?.debug?.(`Birthday: chequeo diario ${day}-${month}`);

	let birthdays;
	try {
		birthdays = await BirthdayRepository.getByMonthDay(month, day);
	}
	catch (err) {
		client.logger?.warn?.(`Birthday: falló la consulta de cumpleaños: ${err.message}`);
		return;
	}

	let announced = 0;
	for (const record of birthdays) {
		if (client.config.guildId && record.guild_id !== client.config.guildId) {
			continue;
		}

		const member = await channel.guild.members.fetch(record.user_id).catch(() => null);
		if (!member || member.user?.bot) {
			continue;
		}

		const embed = baseEmbed(client, { color: COLORS.SUCCESS })
			.setTitle('🎂 ¡Feliz cumpleaños!')
			.setDescription(`¡Hoy cumple años **${member.displayName}**! 🥳`);

		await channel.send({ embeds: [embed] }).catch(() => null);
		announced++;
	}

	if (announced > 0) {
		client.logger?.log?.(`Birthday: ${announced} cumpleaño(s) anunciado(s)`);
	}
}

module.exports = async (client) => {
	setTimeout(() => {
		checkBirthdays(client)
			.catch(err => client.logger?.warn?.(`Birthday: falló el primer chequeo: ${err.message}`));
	}, FIRST_CHECK_DELAY_MS);

	intervalHandle = setInterval(() => {
		checkBirthdays(client)
			.catch(err => client.logger?.warn?.(`Birthday: falló el chequeo diario: ${err.message}`));
	}, DAILY_INTERVAL_MS);

	client.birthdayInterval = intervalHandle;
};
