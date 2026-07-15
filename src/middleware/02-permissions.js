module.exports = (client, message, command, next) => {
    if (command.help && command.help.ownerOnly) {
        if (message.author.id !== client.config.ownerID) {
            return message.reply("no tienes permiso para usar este comando!");
        }
    }
    return next();
};
