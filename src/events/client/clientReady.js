const { initialize } = require('../../database/connect');
const { loadModels, LevelService } = require('../../database/models');
const { registerSlashCommands } = require('../../handlers/loaders/commands');
const { initSessions } = require('./voiceStateUpdate');
const createLevelTable = require('../../database/migrations/createLevelTable');
const createLevelRewardsTable = require('../../database/migrations/createLevelRewardsTable');
const createAfkTable = require('../../database/migrations/createAfkTable');
const initializeContainer = require('../../container');
const AfkService = require('../../services/AfkService');
const RewardService = require('../../services/RewardService');

module.exports = async (client) => {
	try {
		client.logger?.debug?.('ClientReady: initializing database');
		const pool = await initialize();
		await loadModels(pool);
		await createLevelTable();
		await createLevelRewardsTable();
		await createAfkTable();
		await initializeContainer(pool);
		client.levelingService = LevelService;
		client.rewardService = RewardService;
		client.afkService = AfkService;

		client.logger?.debug?.('ClientReady: database initialization successful');
	}
	catch (err) {
		client.logger.error('Startup failed: ', err);
		process.exit(1);
	}

	try {
		client.logger?.debug?.('ClientReady: registering slash commands');
		await registerSlashCommands(client);
		client.logger?.debug?.('ClientReady: slash commands registered');
	}
	catch (err) {
		client.logger.warn('Slash command registration failed: ' + (err?.message || err));
		client.logger?.debug?.(`ClientReady: slash command registration failed: ${err}`);
	}

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
		// Force roles cache before scanning
		await guild.roles.fetch();
		// Force members cache (including bot's own member) before scanning
		const members = await guild.members.fetch();
		const allRewards = await LevelService.rewardService.findAllByGuild(guild.id);
		let registered = 0;
		let rewarded = 0;
		let cleaned = 0;
		let errors = 0;

		for (const [, member] of members) {
			if (member.user.bot) continue;
			try {
				const record = await LevelService.findByUser(member.id, guild.id);

				// Register in DB if not present (synthetic id means no DB row)
				if (record.id === `${guild.id}-${member.id}` && record.points === 0) {
					await LevelService.upsert({
						id: record.id,
						user: member.id,
						guild: guild.id,
						points: 0,
						level: 1,
					});
					registered++;
					client.logger?.debug?.(`ClientReady: registered ${member.id} in DB`);
				}

				// Assign reward for current level (if one exists and member doesn't have it)
				const assigned = await LevelService.assignLevelReward(guild, member, record.level, client.logger);
				if (assigned) {
					rewarded++;
					client.logger?.debug?.(`ClientReady: reward '${assigned}' assigned to ${member.id} for level ${record.level}`);
				}

				// Remove reward roles that are ABOVE the member's actual level
				// (handles cases where someone was manually assigned a higher-tier role)
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
