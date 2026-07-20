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
		client.logger?.debug?.(`Permissions: owner-only denied for ${userId} on command ${command.help.name}`);
		return deny(context, 'no tenés permiso para usar este comando.');
	}

	// moderatorOnly — role-based check + owner may run this command
	if (command.help.moderatorOnly) {
		const isOwner = userId === client.config.ownerID;
		if (!isOwner) {
			// If moderatorRoleId is configured, check role membership
			if (client.config.moderatorRoleId && context.member?.roles?.cache?.has(client.config.moderatorRoleId)) {
				// User has the moderator role, allow through
			}
			else {
				// No moderator role configured, or user doesn't have it
				client.logger?.debug?.(`Permissions: moderator-only denied for ${userId} on command ${command.help.name}`);
				return deny(context, 'no tenés permiso para usar este comando.');
			}
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
