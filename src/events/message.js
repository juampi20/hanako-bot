const xpCooldowns = new Map();
const XP_COOLDOWN_MS = 60000;

/**
 * Return a random integer between min and max (inclusive).
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = async (client, message) => {
    if (message.author.bot) {return;}

    // Award random XP per message in a guild, with 1-minute cooldown
    // Future: add voice XP tracking via voiceStateUpdate events
    if (message.guild) {
        const key = `${message.author.id}:${message.guild.id}`;
        const now = Date.now();
        const lastXP = xpCooldowns.get(key) || 0;
        if (now - lastXP >= XP_COOLDOWN_MS) {
            xpCooldowns.set(key, now);

            const xpAmount = randomInt(client.config.xpMin, client.config.xpMax);
            const result = client.levelingService.addXP(message.author.id, message.guild.id, xpAmount);

            if (result && result.level > result.oldLevel) {
                const channelId = client.config.levelUpChannel;
                const targetChannel = channelId
                    ? await client.channels.fetch(channelId).catch(() => null)
                    : message.channel;

                if (targetChannel) {
                    targetChannel.send(`🎉 ¡${message.author} subió al nivel **${result.level}**!`)
                        .catch(err => client.logger.log(`Level-up notify error: ${err}`, 'error'));
                }
            }
        }
    }

    if (message.content.indexOf(client.config.prefix) !== 0) {return;}

    const args = message.content.slice(client.config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    const cmd = client.commands.get(command);
    if (!cmd) {return;}

    client.logger.log(`${message.author.username} (${message.author.id}) ejecuto el comando ${cmd.help.name}`, "cmd");

    let index = 0;
    const next = async () => {
        const middleware = client.middleware[index++];
        if (!middleware) {
            return cmd.run(client, message, args);
        }
        return middleware(client, message, cmd, next);
    };
    next().catch(err => client.logger.log(err, "error"));
};
