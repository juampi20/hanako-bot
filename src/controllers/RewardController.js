'use strict';

const RewardService = require('../services/RewardService');

/**
 * List all rewards for a guild, sorted by level ascending.
 * @param {string} guildId - Guild ID.
 * @returns {Promise<Array<Object>>} Array of reward objects.
 */
async function listRewards(guildId) {
	return await RewardService.findAllByGuild(guildId);
}

/**
 * Get a reward by ID.
 * @param {string} rewardId - Reward ID.
 * @returns {Promise<Object|null>} The reward object or null if not found.
 */
async function getRewardById(rewardId) {
	return await RewardService.findById(rewardId);
}

/**
 * Create a new reward assignment for a guild level.
 * @param {string} guildId - Guild ID.
 * @param {number} level - Level for the reward.
 * @param {string} roleId - Discord role ID.
 * @param {Object} botMember - Bot member object for hierarchy validation (optional, can be null).
 * @returns {Promise<Object|null>} The created reward object, or null on duplicate.
 * @throws {Error} If rewardService is not configured (should not happen in DI context).
 */
async function createReward(guildId, level, roleId, botMember = null) {
	// Validate hierarchy if botMember is provided
	if (botMember) {
		const role = botMember.guild.roles.cache.get(roleId);
		if (role) {
			const botRole = botMember.roles.highest;
			if (botRole.comparePositionTo(role) < 0) {
				throw new Error('BOT_HIERARCHY');
			}
		}
	}

	const result = await RewardService.create(guildId, level, roleId);
	return result || null;
}

/**
 * Delete a reward by ID.
 * @param {string} rewardId - Reward ID.
 * @param {string} guildId - Guild ID (used for validation).
 * @returns {Promise<boolean>} True if reward was deleted, false if not found or not authorized.
 */
async function deleteReward(rewardId, guildId) {
	const isOwned = await RewardService.verifyGuildOwnership(rewardId, guildId);
	if (!isOwned) return false;

	const result = await RewardService.deleteById(rewardId);
	return result.rowCount > 0;
}

module.exports = {
	listRewards,
	getRewardById,
	createReward,
	deleteReward,
};
