const { PermissionFlagsBits } = require('discord.js');

/**
 * Assign a level reward role to a member.
 * @returns {Promise<string|null>} role name or null
 */
async function assignLevelReward(client, guild, member, level) {
	if (!client.rewardService) {
		client.logger?.debug?.(`AssignLevelReward: reward service unavailable for ${member.id} in ${guild.id}`);
		return null;
	}
	try {
		client.logger?.debug?.(`AssignLevelReward: looking up reward for level ${level} in ${guild.id}`);
		const reward = await client.rewardService.findByGuildAndLevel(guild.id, level);
		if (!reward) {
			client.logger?.debug?.(`AssignLevelReward: no reward configured for level ${level} in ${guild.id}`);
			return null;
		}

		const role = guild.roles.cache.get(reward.role_id);
		if (!role) {
			client.logger?.debug?.(`AssignLevelReward: reward role not found: ${reward.role_id} in ${guild.id}`);
			return null;
		}
		if (member.roles.cache.has(role.id)) {
			client.logger?.debug?.(`AssignLevelReward: member already has role ${role.id} for ${member.id}`);
			return null;
		}

		// Remove previous reward roles (mutually exclusive per guild)
		const allRewards = await client.rewardService.findAllByGuild(guild.id);
		const prevRoleIds = allRewards
			.filter(r => r.role_id !== reward.role_id)
			.map(r => r.role_id)
			.filter(id => member.roles.cache.has(id));

		const botMember = guild.members.me;
		if (botMember.roles.highest.comparePositionTo(role) >= 0 && botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
			client.logger?.debug?.(`AssignLevelReward: assigning role ${role.id} to ${member.id}`);
			await member.roles.remove(prevRoleIds);
			await member.roles.add(role.id);
			return role.name;
		}
		else {
			client.logger?.log?.('assignLevelReward: hierarchy/permission blocked', 'warn');
			client.logger?.debug?.(`AssignLevelReward: hierarchy/permission blocked for ${member.id} role ${role.id}`);
			return null;
		}
	}
	catch (err) {
		client.logger?.log?.(`assignLevelReward: exception: ${err}`, 'error');
		return null;
	}
}

/**
 * Send level-up notification.
 */
async function notifyLevelUp(client, guild, member, level) {
	// Early return if level-up notifications are disabled
	if (!client.config.levelUpNotify) return;

	try {
		const interval = client.config.levelUpNotifyInterval || 5;
		const levelReward = await client.rewardService?.findByGuildAndLevel(guild.id, level);
		if (level % interval !== 0 && !levelReward) {return;}
		const channelId = client.config.levelUpChannel;
		const targetChannel = channelId
			? await client.channels.fetch(channelId).catch(() => null)
			: guild.systemChannel;

		if (!targetChannel) {return;}

		client.logger?.debug?.(`LevelUp: rewarding ${member.id} to level ${level}`);
		let msg = `🎉 ¡${member} subió al nivel **${level}**!`;

		if (levelReward) {
			const role = guild.roles.cache.get(levelReward.role_id);
			if (role) {
				msg += `\n📜 Has recibido el rol **${role.name}**`;
				client.logger?.debug?.(`LevelUp: assigned role ${role.id} to ${member.id}`);
			}
		}

		await targetChannel.send(msg).catch(err => client.logger?.log?.(`notifyLevelUp: ${err}`, 'error'));
	}
	catch (err) {
		client.logger?.log?.(`notifyLevelUp: exception: ${err}`, 'error');
	}
}

module.exports = { assignLevelReward, notifyLevelUp };