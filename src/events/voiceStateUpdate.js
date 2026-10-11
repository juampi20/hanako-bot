const LevelRepository = require('../database/repositories/LevelRepository');
const AfkRepository = require('../database/repositories/AfkRepository');
const { randomInt } = require('../utils/random');

// key: userId, value: true
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

async function tick(client) {
	const amount = randomInt(client.config.voiceXpMin, client.config.voiceXpMax);
	const guild = client.guilds.cache.get(client.config.guildId);
	for (const [userId] of sessions) {
		try {
			if (!guild) {
				sessions.delete(userId);
				continue;
			}

			const member = await guild.members.fetch(userId).catch(() => null);
			if (!member || member.user.bot) {
				sessions.delete(userId);
				continue;
			}

			const vs = member.voice;
			if (!vs || !vs.channelId || vs.selfMute || vs.serverMute || vs.selfDeaf || vs.serverDeaf || vs.channelId === guild.afkChannelId) {
				sessions.delete(userId);
				continue;
			}

			const result = await LevelRepository.addXP(userId, amount);
			if (result) {
				client.logger?.debug?.(`Voice XP: granted ${amount} XP to ${userId}, level: ${result.level}`);
				if (result.level > result.oldLevel) {
					await LevelRepository.onLevelUp(guild, member, result, client.config, client.logger);
					client.logger?.debug?.(`Voice XP: level-up for ${userId} from ${result.oldLevel} to ${result.level}`);
				}
			}
			else {
				client.logger?.debug?.(`Voice XP: XP service unavailable for ${userId}`);
			}
		}
		catch (err) {
			client.logger?.log?.(`Voice XP tick error: ${err}`, 'error');
		}
	}
}

module.exports = async (client, oldState, newState) => {
	try {
		const userId = newState.id || oldState.id;
		const key = userId;

		// ── AFK: auto-set / auto-remove on voice channel joins/moves ──────────────
		const guild = newState.guild || oldState.guild;
		const targetChannelId = newState.channelId;
		const oldChannelId = oldState.channelId;

		if (guild?.afkChannelId && !newState.member?.user?.bot) {
			const isInAfkChannel = targetChannelId === guild.afkChannelId;
			const wasInAfkChannel = oldChannelId === guild.afkChannelId;

			const afkNotifyTarget = client.config.afkNotify && client.config.afkChannelId
				? guild.channels.cache.get(client.config.afkChannelId)
				: null;

			if (isInAfkChannel && !wasInAfkChannel) {
				const member = newState.member || (await newState.guild?.members.fetch(userId).catch(() => null));
				if (!member || member.user?.bot) { return; }
				const existing = await AfkRepository.isAfk(userId);
				const currentChannelId = member.voice?.channelId;
				if (!existing && currentChannelId === guild.afkChannelId) {
					await AfkRepository.set(userId, 'Está ausente', Math.floor(Date.now() / 1000));
					if (afkNotifyTarget) {
						afkNotifyTarget.send(`${member.displayName} está ahora AFK (canal de voz AFK).`).catch(() => null);
					}
				}
			}

			if (!isInAfkChannel && wasInAfkChannel) {
				const existing = await AfkRepository.isAfk(userId);
				if (existing) {
					await AfkRepository.remove(userId);
					if (afkNotifyTarget) {
						afkNotifyTarget.send(`${newState.member?.displayName || userId} ya no está AFK (salió del canal AFK).`).catch(() => null);
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

async function initSessions(client) {
	const guildId = client.config.guildId;
	for (const [, guild] of client.guilds.cache) {
		if (guildId && guild.id !== guildId) {continue;}
		if (!guild.voiceStates || !guild.voiceStates.cache) {continue;}
		for (const [, vs] of guild.voiceStates.cache) {
			if (!vs.channelId) {continue;}
			const member = vs.member;
			if (!member || member.user?.bot) {continue;}
			const key = member.id;
			if (isEligible(client, vs)) {
				addSession(client, key);
			}
		}

		if (guild.afkChannelId) {
			for (const [, vs] of guild.voiceStates.cache) {
				if (vs.channelId !== guild.afkChannelId) {continue;}
				if (!vs.member || vs.member.user?.bot) {continue;}
				try {
					const existing = await AfkRepository.isAfk(vs.member.id);
					if (!existing) {
						await AfkRepository.set(
							vs.member.id,
							'Está ausente',
							Math.floor(Date.now() / 1000),
						);
					}
				}
				catch (err) {
					client.logger?.debug?.(`AFK: init auto-mark failed for ${vs.member?.id}: ${err.message}`);
				}
			}
		}
	}
}

module.exports.sessions = sessions;
module.exports.tick = tick;
module.exports.initSessions = initSessions;
