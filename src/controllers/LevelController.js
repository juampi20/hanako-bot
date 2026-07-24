'use strict';

const LevelService = require('../services/LevelService');

/**
 * Get user rank, leaderboard, and XP bar data.
 * @param {string} userId - User ID.
 * @param {string} guildId - Guild ID.
 * @returns {Promise<Object>} Object containing rank, leaderboard data, and XP bar info.
 */
async function getRank(userId, guildId) {
	const score = await LevelService.findByUser(userId, guildId);
	const currentLevel = score.level;
	const currentXP = score.points;
	const xpForCurrent = LevelService.getXPForLevel(currentLevel);
	const xpForNext = LevelService.getXPForLevel(currentLevel + 1);

	const xpFloor = currentLevel <= 1 ? 0 : xpForCurrent;
	const xpIntoLevel = Math.max(0, currentXP - xpFloor);
	const xpNeeded = xpForNext - xpFloor;

	// Find rank position
	const leaderboard = await LevelService.getLeaderboard(guildId, 1000);
	const rank = leaderboard.findIndex(entry => entry.user === userId) + 1;

	return {
		score,
		xpForCurrent,
		xpForNext,
		xpFloor,
		xpIntoLevel,
		xpNeeded,
		rank,
	};
}

/**
 * Get guild leaderboard.
 * @param {string} guildId - Guild ID.
 * @param {number} limit - Maximum entries (default: 10).
 * @returns {Promise<Array<Object>>} Array of leaderboard entries.
 */
async function getLeaderboard(guildId, limit = 10) {
	return await LevelService.getLeaderboard(guildId, limit);
}

/**
 * Set user's XP directly.
 * @param {string} userId - User ID.
 * @param {string} guildId - Guild ID.
 * @param {number} xp - XP amount.
 * @returns {Promise<Object>} Result object with points, level, oldLevel.
 */
async function setXP(userId, guildId, xp) {
	return await LevelService.setXP(userId, guildId, xp);
}

/**
 * Set user's level directly.
 * @param {string} userId - User ID.
 * @param {string} guildId - Guild ID.
 * @param {number} level - Level amount.
 * @returns {Promise<Object>} Result object with points, level, oldLevel.
 */
async function setLevel(userId, guildId, level) {
	return await LevelService.setLevel(userId, guildId, level);
}

module.exports = {
	getRank,
	getLeaderboard,
	setXP,
	setLevel,
};