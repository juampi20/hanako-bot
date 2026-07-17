const xpCooldowns = new Map();
const XP_COOLDOWN_MS = 60000;

/**
 * Return a random integer between min and max (inclusive).
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Assign a level reward role to a member if one exists for their current level
 * and they don't already have the role.
 * Returns the assigned role name or null.
 */
async function assignLevelReward(client, message, level) {
    if (!client.rewardService) {
        return null;
    }
    const reward = client.rewardService.findByGuildAndLevel(message.guild.id, level);
    if (!reward) {
        return null;
    }

    try {
        const member = await message.guild.members.fetch(message.author.id).catch(() => null);
        if (!member) {
            return null;
        }

        const role = message.guild.roles.cache.get(reward.role_id);
        if (!role) {
            return null;
        }

        // Skip if they already have the role
        if (member.roles.cache.has(role.id)) {
            return null;
        }

        // Remove previous reward roles (they're mutually exclusive per guild)
        const allRewards = client.rewardService.findAllByGuild(message.guild.id);
        const prevRoleIds = allRewards
            .filter(r => r.role_id !== reward.role_id)
            .map(r => r.role_id)
            .filter(id => member.roles.cache.has(id));

        const botMember = message.guild.members.me;
        if (botMember.roles.highest.comparePositionTo(role) >= 0 && botMember.permissions.has('MANAGE_ROLES')) {
            await member.roles.remove(prevRoleIds);
            await member.roles.add(role.id);
            return role.name;
        } else {
            client.logger.log(`assignLevelReward: hierarchy/permission blocked: guild ${message.guild.id}, user ${message.author.id}, role ${reward.role_id}`, 'warn');
            return null;
        }
    } catch (err) {
        client.logger.log(`assignLevelReward: exception for ${message.author.id}: ${err}`, 'error');
        return null;
    }
}

module.exports = async (client, message) => {
    if (message.author.bot) { return; }

    // Award random XP per message in a guild, with 1-minute cooldown
    if (message.guild) {
        const key = `${message.author.id}:${message.guild.id}`;
        const now = Date.now();
        const lastXP = xpCooldowns.get(key) || 0;
        if (now - lastXP >= XP_COOLDOWN_MS) {
            xpCooldowns.set(key, now);
            setTimeout(() => xpCooldowns.delete(key), XP_COOLDOWN_MS);

            const xpAmount = randomInt(client.config.xpMin, client.config.xpMax);
            const result = client.levelingService.addXP(message.author.id, message.guild.id, xpAmount);

            if (result) {
                // Assign reward for current level (handles both level-up and retroactive)
                const assignedRole = await assignLevelReward(client, message, result.level);

                if (result.level > result.oldLevel) {
                    const channelId = client.config.levelUpChannel;
                    const targetChannel = channelId
                        ? await client.channels.fetch(channelId).catch(() => null)
                        : message.channel;

                    if (targetChannel) {
                        let msg = `🎉 ¡${message.author} subió al nivel **${result.level}**!`;
                        if (assignedRole) {
                            msg += `\n📜 Has recibido el rol **${assignedRole}**`;
                        }
                        targetChannel.send(msg)
                            .catch(err => client.logger.log(`Level-up notify error: ${err}`, 'error'));
                    }
                }
            }
        }
    }

    if (message.content.indexOf(client.config.prefix) !== 0) { return; }

    const args = message.content.slice(client.config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    const cmd = client.commands.get(command);
    if (!cmd) { return; }

    client.logger.log(`${message.author.username} (${message.author.id}) ejecuto el comando ${cmd.help.name} en ${message.guild?.name || message.guild?.id || "DM"}`, "cmd");

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
                .catch(() => {});
        }
    }).catch(err => client.logger.log(err, "error"));
};
