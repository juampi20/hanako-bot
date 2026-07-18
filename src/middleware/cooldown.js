const cooldowns = new Map();

const cooldown = (client, context, command, next) => {
    const cooldownTime = (command.help && command.help.cooldown) || 3000;
    if (cooldownTime <= 0) {return next();}

    const userId = context.author?.id || context.user?.id;
    const guildId = context.guild?.id || 'dm';
    const key = `${userId}:${guildId}`;
    const now = Date.now();

    if (cooldowns.has(key)) {
        const expiration = cooldowns.get(key);
        if (now < expiration) {
            const remaining = ((expiration - now) / 1000).toFixed(1);
            client.logger?.debug?.(`Cooldown: block for ${userId}:${guildId}, remaining=${remaining}s`);
            if (context.reply) {
                return context.reply({
                    content: `tomate un tiempo. Esperá ${remaining} segundos.`,
                    ephemeral: true
                });
            } else if (context.isReplied) {
                return context.send(`tomate un tiempo. Esperá ${remaining} segundos.`);
            }
        }
    }

    cooldowns.set(key, now + cooldownTime);
    setTimeout(() => cooldowns.delete(key), cooldownTime);
    return next();
};

cooldown.priority = 10;
module.exports = cooldown;
