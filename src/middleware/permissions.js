/**
 * Permission middleware.
 * Checks ownerOnly and moderatorOnly command flags before execution.
 */
const permissions = (client, context, command, next) => {
    if (!command.help) {
        return next();
    }

    const userId = context.author?.id || context.user?.id;

    // ownerOnly — only the configured owner may run this command
    if (command.help.ownerOnly && userId !== client.config.ownerID) {
        return deny(context, 'no tenés permiso para usar este comando.');
    }

    // moderatorOnly — moderator list + owner may run this command
    if (command.help.moderatorOnly) {
        const isModerator = client.config.moderatorIds.includes(userId);
        const isOwner = userId === client.config.ownerID;
        if (!isModerator && !isOwner) {
            return deny(context, 'no tenés permiso para usar este comando.');
        }
    }

    return next();
};

permissions.priority = 20;
module.exports = permissions;

function deny(context, content) {
    if (context.reply) {
        return context.reply({ content, ephemeral: true });
    }
    if (context.isReplied) {
        return context.send(content);
    }
    console.error(`[Permissions] ${content}`);
}
