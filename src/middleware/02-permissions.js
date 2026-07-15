module.exports = (client, context, command, next) => {
    if (command.help && command.help.ownerOnly) {
        const userId = context.author?.id || context.user?.id;
        if (userId !== client.config.ownerID) {
            if (context.reply) {
                return context.reply({
                    content: "no tienes permiso para usar este comando!",
                    ephemeral: true
                });
            } else if (context.isReplied) {
                return context.send("no tienes permiso para usar este comando!");
            } else {
                console.error("Cannot reply to unauthorized access - no reply method available");
            }
        }
    }
    return next();
};
