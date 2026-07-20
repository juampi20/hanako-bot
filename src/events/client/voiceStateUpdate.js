const { assignLevelReward, notifyLevelUp } = require('../../utils/leveling');

// key: `${guildId}:${userId}`, value: true
const sessions = new Map();
let timerHandle = null;

function isEligible(client, state) {
	if (!state.member) {
		client.logger?.debug?.('Voice XP: session skip — state.member is null');
		return false;
	}
	if (state.member.user?.bot) {
		client.logger?.debug?.(`Voice XP: session skip — bot: ${state.member.id}`);
		return false;
	}
	if (!state.channelId) {
		client.logger?.debug?.(`Voice XP: session skip — no channel: ${state.member.id}`);
		return false;
	}
	if (state.serverMute || state.serverDeaf) {
		client.logger?.debug?.(`Voice XP: session skip — server mute/deaf: ${state.member.id}`);
		return false;
	}
	if (state.member.voice?.selfMute || state.member.voice?.selfDeaf) {
		client.logger?.debug?.(`Voice XP: session skip — self mute/deaf: ${state.member.id}`);
		return false;
	}
	if (state.channelId === state.guild?.afkChannelId) {
		client.logger?.debug?.(`Voice XP: session skip — AFK channel: ${state.member.id} -> ${state.channelId}`);
		return false;
	}
	return true;
}

function addSession(client, key) {
	if (sessions.has(key)) {
		client.logger?.debug?.(`Voice XP: session already exists: ${key}`);
		return;
	}
	sessions.set(key, true);
	client.logger?.debug?.(`Voice XP: session added: ${key}`);
	if (!timerHandle) {
		startTimer(client);
	}
}

function removeSession(client, key) {
	sessions.delete(key);
	client.logger?.debug?.(`Voice XP: session removed: ${key}`);
	if (sessions.size === 0) {
		stopTimer(client);
	}
}

function startTimer(client) {
	const intervalMs = 60 * 1000;
	client.logger?.debug?.(`Voice XP: starting voice XP timer, interval=${intervalMs / 1000}s`);
	timerHandle = setInterval(() => tick(client), intervalMs);
}

function stopTimer(client) {
	if (timerHandle) {
		client.logger?.debug?.('Voice XP: stopping voice XP timer');
		clearInterval(timerHandle);
		timerHandle = null;
	}
}

/**
 * Return a random integer between min and max (inclusive).
 */
function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function tick(client) {
	const amount = randomInt(client.config.voiceXpMin, client.config.voiceXpMax);
	const allowedGuildId = client.config.guildId;
	for (const [key] of sessions) {
		try {
			const [guildId, userId] = key.split(':');
			// Skip sessions for non-allowed guild if guildId is configured
			if (allowedGuildId && guildId !== allowedGuildId) {
				continue;
			}

			const guild = client.guilds.cache.get(guildId);
			if (!guild) {
				sessions.delete(key);
				continue;
			}

			const member = await guild.members.fetch(userId).catch(() => null);
			if (!member || member.user.bot) {
				sessions.delete(key);
				continue;
			}

			const vs = member.voice;
			if (!vs || !vs.channelId || vs.selfMute || vs.serverMute || vs.selfDeaf || vs.serverDeaf || vs.channelId === guild.afkChannelId) {
				sessions.delete(key);
				continue;
			}

			const result = client.levelingService?.addXP(userId, guildId, amount);
			if (result) {
				client.logger?.debug?.(`Voice XP: granted ${amount} XP to ${userId} in ${guildId}, level: ${result.level}`);
				if (result.level > result.oldLevel) {
					await assignLevelReward(client, guild, member, result.level);
					await notifyLevelUp(client, guild, member, result.level);
					client.logger?.debug?.(`Voice XP: level-up for ${userId} from ${result.oldLevel} to ${result.level}`);
				}
			}
			else {
				client.logger?.debug?.(`Voice XP: XP service unavailable for ${userId} in ${guildId}`);
			}
		}
		catch (err) {
			client.logger?.log?.(`Voice XP tick error: ${err}`, 'error');
		}
	}
}

module.exports = async (client, oldState, newState) => {
	try {
		const guildId = newState.guild?.id || oldState.guild?.id;
		const userId = newState.id || oldState.id;
		const key = `${guildId}:${userId}`;

		// ── AFK: auto-set / auto-remove on voice channel joins/moves ──────────────
		const guild = newState.guild || oldState.guild;
		const targetChannelId = newState.channelId;
		const oldChannelId = oldState.channelId;

		if (guild?.afkChannelId && !newState.member?.user?.bot) {
			const isInAfkChannel = targetChannelId === guild.afkChannelId;
			const wasInAfkChannel = oldChannelId === guild.afkChannelId;

			// Join or move INTO AFK channel: set AFK (if not already)
			if (isInAfkChannel && !wasInAfkChannel) {
				const member = newState.member || (await newState.guild?.members.fetch(userId).catch(() => null));
				if (!member || member.user?.bot) { return; }
				const existing = client.afkService?.isAfk(userId, guildId);
				// Re-check channel after await (TOCTOU guard)
				const currentChannelId = member.voice?.channelId;
				if (!existing && currentChannelId === guild.afkChannelId) {
					const nickname = member.nickname || member.user.username;
					client.afkService.set(userId, guildId, 'Está ausente', Math.floor(Date.now() / 1000), nickname);
					// Notify in guild system channel or DM
					const target = guild.systemChannel || await member.createDM().catch(() => null);
					if (target) {
						target.send(`<@${userId}> está ahora AFK (canal de voz AFK).`).catch(() => null);
					}
				}
			}

			// Leave or move OUT OF AFK channel: remove AFK (if present)
			if (!isInAfkChannel && wasInAfkChannel) {
				const existing = client.afkService?.isAfk(userId, guildId);
				if (existing) {
					client.afkService.remove(userId, guildId);
					// Restore nickname
					if (existing.was_nickname && newState.member) {
						newState.member.setNickname(existing.was_nickname, 'Restoring pre-AFK nickname')
							.catch(err => client.logger?.debug?.(`AFK: nickname restore failed for ${userId}: ${err.message}`));
					}
					const target = guild.systemChannel || await newState.member?.createDM().catch(() => null);
					if (target) {
						target.send(`<@${userId}> ya no está AFK (se unió a un canal de voz).`).catch(() => null);
					}
				}
			}
		}

		// Join: was null, now has channel
		if (!oldState.channelId && newState.channelId) {
			if (isEligible(client, newState)) {addSession(client, key);}
			return;
		}

		// Leave: had channel, now null
		if (oldState.channelId && !newState.channelId) {
			removeSession(client, key);
			return;
		}

		// Move: both non-null, different channels
		if (oldState.channelId !== newState.channelId) {
			removeSession(client, key);
			if (isEligible(client, newState)) {addSession(client, key);}
			return;
		}

		// Same channel: mute/deafen toggle
		if (oldState.channelId === newState.channelId) {
			const wasEligible = isEligible(client, oldState);
			const nowEligible = isEligible(client, newState);

			if (wasEligible && !nowEligible) {removeSession(client, key);}
			else if (!wasEligible && nowEligible) {addSession(client, key);}
		}
	}
	catch (err) {
		client.logger?.log?.(`Voice XP handler error: ${err}`, 'error');
	}
};

/**
 * Scan all guilds for members already in voice channels and add them to sessions.
 * Called once on bot ready to catch users who joined before the bot started.
 *
 * Uses guild.voiceStates.cache directly instead of channel.members because
 * channel.members depends on guild.members.cache which may be empty at ready time.
 */
async function initSessions(client) {
	const allowedGuildId = client.config.guildId;
	for (const [, guild] of client.guilds.cache) {
		// Filter by allowed guild if guildId is configured
		if (allowedGuildId && guild.id !== allowedGuildId) {continue;}
		if (!guild.voiceStates || !guild.voiceStates.cache) {continue;}
		for (const [, vs] of guild.voiceStates.cache) {
			if (!vs.channelId) {continue;}
			const member = vs.member;
			if (!member || member.user?.bot) {continue;}
			const key = `${guild.id}:${member.id}`;
			if (isEligible(client, vs)) {
				addSession(client, key);
			}
		}
	}
}

// Export for testing — keep even if unused
sessions;
module.exports.sessions = sessions;
module.exports.tick = tick;
module.exports.initSessions = initSessions;