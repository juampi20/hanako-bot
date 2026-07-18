const { assignLevelReward, notifyLevelUp } = require('../../utils/leveling');

const sessions = new Map(); // key: `${guildId}:${userId}`, value: true
let timerHandle = null;

function isEligible(client, state) {
    if (!state.member) {
        client.logger?.debug?.("Voice XP: session skip — state.member is null");
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
    const intervalMs = (client.config.voiceXpInterval || 60) * 1000;
    client.logger?.debug?.(`Voice XP: starting voice XP timer, interval=${intervalMs / 1000}s`);
    timerHandle = setInterval(() => tick(client), intervalMs);
}

function stopTimer(client) {
    if (timerHandle) {
        client.logger?.debug?.("Voice XP: stopping voice XP timer");
        clearInterval(timerHandle);
        timerHandle = null;
    }
}

async function tick(client) {
    const amount = client.config.voiceXpAmount || 4;
    for (const [key] of sessions) {
        try {
            const [guildId, userId] = key.split(':');
            const guild = client.guilds.cache.get(guildId);
            if (!guild) { sessions.delete(key); continue; }

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
            } else {
                client.logger?.debug?.(`Voice XP: XP service unavailable for ${userId} in ${guildId}`);
            }
        } catch (err) {
            client.logger?.log?.(`Voice XP tick error: ${err}`, 'error');
        }
    }
}

module.exports = async (client, oldState, newState) => {
    try {
        const guildId = newState.guild?.id || oldState.guild?.id;
        const userId = newState.id || oldState.id;
        const key = `${guildId}:${userId}`;

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
    } catch (err) {
        client.logger?.log?.(`Voice XP handler error: ${err}`, 'error');
    }
};

/**
 * Scan all guilds for members already in voice channels and add them to sessions.
 * Called once on bot ready to catch users who joined before the bot started.
 */
async function initSessions(client) {
    for (const [, guild] of client.guilds.cache) {
        for (const [, channel] of guild.channels.cache) {
            if (channel.type !== 'voice') {continue;}
            if (!channel.members) {continue;}
            for (const [, member] of channel.members) {
                const key = `${guild.id}:${member.id}`;
                if (isEligible(client, member.voice)) {
                    addSession(client, key);
                }
            }
        }
    }
}

// Export for testing
sessions;  // Keep export even if unused
module.exports.sessions = sessions;
module.exports.tick = tick;
module.exports.initSessions = initSessions;