const { initSessions } = require('./voiceStateUpdate');
const LevelRepository = require('../database/repositories/LevelRepository');

module.exports = async (client) => {
	// Scan existing voice channels for users who joined before the bot started
	try {
		client.logger?.debug?.('ClientReady: initializing voice XP sessions');
		await initSessions(client);
		client.logger?.debug?.('ClientReady: voice XP sessions initialized');
		client.logger.log('Voice XP sessions initialized from existing channels.', 'log');
	}
	catch (err) {
		client.logger.warn('Voice initSessions failed: ' + (err?.message || err));
		client.logger?.debug?.(`ClientReady: voice initSessions failed: ${err}`);
	}

	// Scan all members: register in DB, assign missing rewards, remove unearned rewards
	try {
		client.logger?.debug?.('ClientReady: scanning members for level rewards');
		const guild = await client.guilds.fetch(client.config.guildId);
		await guild.roles.fetch();
		const members = await guild.members.fetch();
		const allRewards = await LevelRepository.findAllRewardsByGuild(guild.id);
		let registered = 0;
		let rewarded = 0;
		let cleaned = 0;
		let errors = 0;

		for (const [, member] of members) {
			if (member.user.bot) continue;
			try {
				const record = await LevelRepository.findByUser(member.id, guild.id);

				if (record.id === `${guild.id}-${member.id}` && record.points === 0) {
					await LevelRepository.upsert({
						id: record.id,
						user: member.id,
						guild: guild.id,
						points: 0,
						level: 1,
					});
					registered++;
					client.logger?.debug?.(`ClientReady: registered ${member.id} in DB`);
				}

				const assigned = await LevelRepository.assignLevelReward(guild, member, record.level, client.logger);
				if (assigned) {
					rewarded++;
					client.logger?.debug?.(`ClientReady: reward '${assigned}' assigned to ${member.id} for level ${record.level}`);
				}

				const unearnedRewardRoleIds = allRewards
					.filter(r => r.level > record.level)
					.map(r => r.role_id)
					.filter(id => member.roles.cache.has(id));

				if (unearnedRewardRoleIds.length > 0) {
					await member.roles.remove(unearnedRewardRoleIds);
					cleaned++;
					client.logger?.debug?.(`ClientReady: removed unearned reward roles [${unearnedRewardRoleIds.join(',')}] from ${member.id}`);
				}
			}
			catch (err) {
				errors++;
				client.logger?.debug?.(`ClientReady: member scan error for ${member.id}: ${err.message}`);
			}
		}

		client.logger.log(`Members scanned: ${members.size - members.filter(m => m.user.bot).size} members, ${registered} registered, ${rewarded} rewarded, ${cleaned} cleaned, ${errors} errors.`, 'log');
		client.logger?.debug?.('ClientReady: member scan complete');
	}
	catch (err) {
		client.logger.warn('Member scan failed: ' + (err?.message || err));
		client.logger?.debug?.(`ClientReady: member scan failed: ${err}`);
	}

	client.logger.log(`${client.user.username} esta listo.`, 'ready');
	client.user.setActivity('Made with ❤');
};
