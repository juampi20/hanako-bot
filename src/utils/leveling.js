// Legacy compatibility shim — forwards old API to LevelService
// Old signature: assignLevelReward(client, guild, member, level)
// Old signature: notifyLevelUp(client, guild, member, level)
// These functions have been moved to LevelService as static methods.

const LevelService = require('../services/LevelService');

async function assignLevelReward(_client, guild, member, level) {
	return LevelService.assignLevelReward(guild, member, level);
}

async function notifyLevelUp(client, guild, member, level) {
	return LevelService.notifyLevelUp(guild, member, level, client?.config);
}

module.exports = { assignLevelReward, notifyLevelUp };
