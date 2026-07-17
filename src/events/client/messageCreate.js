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
                const member = message.member || await message.guild.members.fetch(message.author.id).catch(() => null);
                if (member) await assignLevelReward(client, message.guild, member, result.level);

                if (result.level > result.oldLevel) {
                    await notifyLevelUp(client, message.guild, message.member, result.level);
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
