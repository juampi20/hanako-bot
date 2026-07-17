const { assignLevelReward, notifyLevelUp } = require('../../utils/leveling');

const sessions = new Map(); // key: `${guildId}:${userId}`, value: true
let timerHandle = null;

function isEligible(state) {
    if (state.member.user.bot) return false;
    if (!state.channelId) return false;
    if (state.member.voice?.selfMute || state.serverMute) return false;
    if (state.member.voice?.selfDeaf || state.serverDeaf) return false;
    if (state.channelId === state.guild?.afkChannelId) return false;
    return true;
}

function addSession(client, key) {
    if (sessions.has(key)) return;
    sessions.set(key, true);
    if (!timerHandle) startTimer(client);
}

function removeSession(key) {
    sessions.delete(key);
    if (sessions.size === 0) stopTimer();
}

function startTimer(client) {
    const intervalMs = (client.config.voiceXpInterval || 60) * 1000;
    timerHandle = setInterval(() => tick(client), intervalMs);
}

function stopTimer() {
    if (timerHandle) {
        clearInterval(timerHandle);
        timerHandle = null;
    }
}

async function tick(client) {
    const amount = client.config.voiceXpAmount || 10;
    for (const [key] of sessions) {
        try {
            const [guildId, userId] = key.split(':');
            const guild = client.guilds.cache.get(guildId);
            if (!guild) { sessions.delete(key); continue; }

            const member = await guild.members.fetch(userId).catch(() => null);
            if (!member || !member.voice.channel || member.user.bot) {
                sessions.delete(key);
                continue;
            }

            const vs = member.voice;
            if (vs.selfMute || vs.serverMute || vs.selfDeaf || vs.serverDeaf || vs.channelId === guild.afkChannelId) {
                sessions.delete(key);
                continue;
            }

            const result = client.levelingService?.addXP(userId, guildId, amount);
            if (result && result.level > result.oldLevel) {
                await assignLevelReward(client, guild, member, result.level);
                await notifyLevelUp(client, guild, member, result.level);
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
            if (isEligible(newState)) addSession(client, key);
            return;
        }

        // Leave: had channel, now null
        if (oldState.channelId && !newState.channelId) {
            removeSession(key);
            return;
        }

        // Move: both non-null, different channels
        if (oldState.channelId !== newState.channelId) {
            removeSession(key);
            if (isEligible(newState)) addSession(client, key);
            return;
        }

        // Same channel: mute/deafen toggle
        if (oldState.channelId === newState.channelId) {
            const wasEligible = isEligible(oldState);
            const nowEligible = isEligible(newState);

            if (wasEligible && !nowEligible) removeSession(key);
            else if (!wasEligible && nowEligible) addSession(client, key);
        }
    } catch (err) {
        client.logger?.log?.(`Voice XP handler error: ${err}`, 'error');
    }
};