module.exports = async function(client, member) {
	// Never assign roles to bots
	if (member.user.bot) { return; }

	const roleId = client.config.autoRoleId;
	if (!roleId) { return; }

	const role = member.guild.roles.cache.get(roleId);
	if (!role) {
		client.logger?.warn?.(`AutoRole: configured role ${roleId} not found in guild ${member.guild.id}`);
		return;
	}

	const botMember = member.guild.members.me;
	if (!botMember.permissions.has('ManageRoles')) {
		client.logger?.error?.(`AutoRole: bot lacks ManageRoles permission in guild ${member.guild.id}`);
		return;
	}

	if (role.position >= botMember.roles.highest.position) {
		client.logger?.error?.(`AutoRole: role '${role.name}' (${roleId}) is above the bot's highest role in guild ${member.guild.id}`);
		return;
	}

	let assigned = false;
	await member.roles.add(roleId).then(() => {
		assigned = true;
	}).catch(err => {
		client.logger?.error?.(`AutoRole: failed to assign role ${roleId} to ${member.id}: ${err.message || err}`);
	});

	if (assigned) {
		client.logger?.debug?.(`AutoRole: assigned role ${roleId} to ${member.id} in guild ${member.guild.id}`);
	}
};
