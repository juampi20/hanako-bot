const { getLevelFromXP } = require('../database/models/Score');

/**
 * Assign a level reward role to a member.
 * @returns {Promise<string|null>} role name or null
 */
async function assignLevelReward(client, guild, member, level) {
    if (!client.rewardService) return null;
    try {
        const reward = client.rewardService.findByGuildAndLevel(guild.id, level);
        if (!reward) return null;

        const role = guild.roles.cache.get(reward.role_id);
        if (!role) return null;
        if (member.roles.cache.has(role.id)) return null;

        // Remove previous reward roles (mutually exclusive per guild)
        const allRewards = client.rewardService.findAllByGuild(guild.id);
        const prevRoleIds = allRewards
            .filter(r => r.role_id !== reward.role_id)
            .map(r => r.role_id)
            .filter(id => member.roles.cache.has(id));

        const botMember = guild.members.me;
        if (botMember.roles.highest.comparePositionTo(role) >= 0 && botMember.permissions.has('MANAGE_ROLES')) {
            await member.roles.remove(prevRoleIds);
            await member.roles.add(role.id);
            return role.name;
        } else {
            client.logger?.log?.('assignLevelReward: hierarchy/permission blocked', 'warn');
            return null;
        }
    } catch (err) {
        client.logger?.log?.(`assignLevelReward: exception: ${err}`, 'error');
        return null;
    }
}

/**
 * Send level-up notification.
 */
async function notifyLevelUp(client, guild, member, level) {
    try {
        const channelId = client.config.levelUpChannel;
        const targetChannel = channelId
            ? await client.channels.fetch(channelId).catch(() => null)
            : guild.systemChannel;

        if (!targetChannel) return;

        let msg = `🎉 ¡${member} subió al nivel **${level}**!`;

        const reward = client.rewardService?.findByGuildAndLevel(guild.id, level);
        if (reward) {
            const role = guild.roles.cache.get(reward.role_id);
            if (role) {
                msg += `\n📜 Has recibido el rol **${role.name}**`;
            }
        }

        await targetChannel.send(msg).catch(err => client.logger?.log?.(`notifyLevelUp: ${err}`, 'error'));
    } catch (err) {
        client.logger?.log?.(`notifyLevelUp: exception: ${err}`, 'error');
    }
}

module.exports = { assignLevelReward, notifyLevelUp };