const xpCooldowns = new Map();
const XP_COOLDOWN_MS = 60000;

const { assignLevelReward, notifyLevelUp } = require('../../utils/leveling');
const { baseEmbed, COLORS } = require('../../utils/embed');

function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = async (client, message) => {
	if (message.author.bot) { return; }

	// ── AFK: sender auto-remove ──────────────────────────
	if (message.guild) {
		try {
			const afkRecord = client.afkService?.isAfk(message.author.id, message.guild.id);
			if (afkRecord) {
				// Elimina el registro AFK del usuario
				client.afkService.remove(message.author.id, message.guild.id);

				// Notifica en el canal si la configuración lo requiere (sin modificar apodos)
				if (client.config.afkNotify) {
					const target = client.config.afkChannelId
						? message.guild.channels.cache.get(client.config.afkChannelId)
						: message.channel;
					if (target) {
						target.send(`${message.author}, ¡bienvenidx de vuelta! Ya no estás AFK.`)
							.catch(() => null);
					}
				}
			}
		}
		catch (err) {
			client.logger?.debug?.(`AFK: sender auto-remove failed for ${message.author.id}: ${err.message}`);
		}
	}

	// Guild lock check
	if (client.config.guildId && message.guild?.id !== client.config.guildId) {
		client.logger?.debug?.(`MessageCreate: ignoring message from non-guild ${message.guild?.id}`);
		return;
	}

	// Award random XP per message
	if (message.guild) {
		const key = `${message.author.id}:${message.guild.id}`;
		const now = Date.now();
		const lastXP = xpCooldowns.get(key) || 0;
		if (now - lastXP >= XP_COOLDOWN_MS) {
			xpCooldowns.set(key, now);
			setTimeout(() => xpCooldowns.delete(key), XP_COOLDOWN_MS);

			const xpAmount = randomInt(client.config.chatXpMin, client.config.chatXpMax);
			client.logger?.debug?.(`Message XP: processing XP for ${message.author.id} in ${message.guild.id}, amount=${xpAmount}`);
			const result = client.levelingService.addXP(message.author.id, message.guild.id, xpAmount);

			if (result) {
				client.logger?.debug?.(`Message XP: XP recorded - user=${message.author.id} old=${result.oldLevel} new=${result.level}`);
				const member = message.member || await message.guild.members.fetch(message.author.id).catch(() => null);
				if (member) { await assignLevelReward(client, message.guild, member, result.level); }

				if (result.level > result.oldLevel) {
					await notifyLevelUp(client, message.guild, message.member, result.level);
					client.logger?.debug?.(`Message XP: level-up for ${message.author.id} to level ${result.level}`);
				}
			}
		}
	}

	// ── AFK: mention auto-reply ──────────────────────────
	if (message.guild && !message.author.bot && !message.mentions.everyone && client.config.afkAutoReply) {
		try {
			// Obtenemos todos los usuarios mencionados (excluyendo bots y al propio autor)
			const mentionedAfkUsers = new Set();

			for (const user of message.mentions.users.values()) {
				if (user.bot || user.id === message.author.id) continue;

				const record = client.afkService?.isAfk(user.id, message.guild.id);
				if (record) {
					mentionedAfkUsers.add(user.id);
				}
			}

			// Si se mencionó a al menos un usuario AFK
			for (const userId of mentionedAfkUsers) {
				const record = client.afkService?.isAfk(userId, message.guild.id);
				if (!record) continue;

				const targetMember = message.guild.members.cache.get(userId);
				const displayName = targetMember?.displayName || userId;

				const embed = baseEmbed(client, { color: COLORS.INFO })
					.setTitle('💤 Usuario Ausente')
					.setDescription(`**${displayName}** está actualmente AFK.`)
					.addFields(
						{ name: 'Motivo', value: record.reason || 'Sin motivo', inline: true },
						{ name: 'Desde', value: `<t:${record.started_at}:R>`, inline: true },
					);

				// Responde al mensaje del usuario y se borra a los 30 segundos
				message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } })
					.then(msg => {
						setTimeout(() => msg.delete().catch(() => null), 30000);
					})
					.catch(() => null);
			}
		}
		catch (err) {
			client.logger?.debug?.(`AFK: mention auto-reply failed: ${err.message}`);
		}
	}

	if (message.content.indexOf(client.config.prefix) !== 0) { return; }

	const args = message.content.slice(client.config.prefix.length).trim().split(/ +/g);
	const command = args.shift().toLowerCase();

	const cmd = client.commands.get(command);
	if (!cmd) {
		client.logger?.debug?.(`MessageCreate: command not found: ${command}`);
		return;
	}

	client.logger.debug(`${message.author.username} (${message.author.id}) ejecuto el comando ${cmd.help.name} en ${message.guild?.name || message.guild?.id || 'DM'}`);

	let index = 0;
	const next = async () => {
		const middleware = client.middleware[index++];
		if (!middleware) {
			return cmd.run(client, message, args);
		}
		return middleware(client, message, cmd, next);
	};
	next().then(() => {
		if (cmd.help && cmd.help.hintSlash) {
			message.channel.send(`💡 Probá también /${cmd.help.hintSlash}`)
				.catch(() => {
					/* silently fail */
				});
		}
	}).catch(err => client.logger.log(err, 'error'));
};