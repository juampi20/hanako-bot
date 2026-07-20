const xpCooldowns = new Map();
const XP_COOLDOWN_MS = 60000;

const { assignLevelReward, notifyLevelUp } = require('../../utils/leveling');

/**
 * Return a random integer between min and max (inclusive).
 */
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
				client.afkService.remove(message.author.id, message.guild.id);
				// Restore nickname
				if (afkRecord.was_nickname) {
					const member = message.member || await message.guild.members.fetch(message.author.id).catch(() => null);
					if (member) {
						member.setNickname(afkRecord.was_nickname, 'Restoring pre-AFK nickname')
							.catch(err => client.logger?.debug?.(`AFK: nickname restore failed for ${message.author.id}: ${err.message}`));
					}
				}
				// Notify if enabled
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

	// Guild lock check - only process messages from the configured guild
	if (client.config.guildId && message.guild?.id !== client.config.guildId) {
		client.logger?.debug?.(`MessageCreate: ignoring message from non-guild ${message.guild?.id}`);
		return;
	}

	// Award random XP per message in a guild, with 1-minute cooldown
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
				// Assign reward for current level (handles both level-up and retroactive)
				const member = message.member || await message.guild.members.fetch(message.author.id).catch(() => null);
				if (member) {await assignLevelReward(client, message.guild, member, result.level);}

				if (result.level > result.oldLevel) {
					await notifyLevelUp(client, message.guild, message.member, result.level);
					client.logger?.debug?.(`Message XP: level-up for ${message.author.id} to level ${result.level}`);
				}
			}
		}
	}

	// ── AFK: mention auto-reply ──────────────────────────
	if (message.guild && !message.mentions.everyone && client.config.afkAutoReply) {
		try {
			const target = client.config.afkChannelId
				? message.guild.channels.cache.get(client.config.afkChannelId)
				: message.channel;
			if (!target) return;

			const mentionedAfkUsers = new Set();
			for (const user of message.mentions.users.values()) {
				if (user.bot) continue;
				const record = client.afkService?.isAfk(user.id, message.guild.id);
				if (record) mentionedAfkUsers.add(user.id);
			}
			for (const userId of mentionedAfkUsers) {
				const record = client.afkService?.isAfk(userId, message.guild.id);
				if (!record) continue;
				const elapsed = `<t:${record.started_at}:R>`;
				target.send(`@${message.guild.members.cache.get(userId)?.displayName || userId} está ausente · Motivo: ${record.reason} · Desde: ${elapsed}`)
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
