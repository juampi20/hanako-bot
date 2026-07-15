const cooldowns = new Map();

module.exports = (client, message, command, next) => {
    const cooldownTime = (command.help && command.help.cooldown) || 3000;
    if (cooldownTime <= 0) return next();

    const key = `${message.author.id}:${message.guild ? message.guild.id : 'dm'}`;
    const now = Date.now();

    if (cooldowns.has(key)) {
        const expiration = cooldowns.get(key);
        if (now < expiration) {
            const remaining = ((expiration - now) / 1000).toFixed(1);
            return message.reply(`tomate un tiempo. Esperá ${remaining} segundos.`);
        }
    }

    cooldowns.set(key, now + cooldownTime);
    setTimeout(() => cooldowns.delete(key), cooldownTime);
    next();
};
