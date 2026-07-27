'use strict';

class LevelController {
	constructor(levelService) {
		this.#levelService = levelService;
	}

	#levelService;

	/**
	 * Get user rank, leaderboard, and XP bar data.
	 * @param {string} userId - User ID.
	 * @param {string} guildId - Guild ID.
	 * @returns {Promise<Object>} Object containing rank, leaderboard data, and XP bar info.
	 */
	async getRank(userId, guildId) {
		const score = await this.#levelService.findByUser(userId, guildId);
		const currentLevel = score.level;
		const currentXP = score.points;
		const xpForCurrent = this.#levelService.getXPForLevel(currentLevel);
		const xpForNext = this.#levelService.getXPForLevel(currentLevel + 1);

		const xpFloor = currentLevel <= 1 ? 0 : xpForCurrent;
		const xpIntoLevel = Math.max(0, currentXP - xpFloor);
		const xpNeeded = xpForNext - xpFloor;

		// Find rank position
		const leaderboard = await this.#levelService.getLeaderboard(guildId, 1000);
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
	 * Get guild leaderboard with pagination.
	 * @param {string} guildId - Guild ID.
	 * @param {number} limit - Maximum entries (default: 10).
	 * @param {number} offset - Offset for pagination (default: 0).
	 * @returns {Promise<Array<Object>>} Array of leaderboard entries.
	 */
	async getLeaderboard(guildId, limit = 10, offset = 0) {
		return await this.#levelService.getLeaderboard(guildId, limit, offset);
	}

	/**
	 * Get total leaderboard entries for a guild.
	 * @param {string} guildId - Guild ID.
	 * @returns {Promise<number>} Total count.
	 */
	async getLeaderboardCount(guildId) {
		return await this.#levelService.getLeaderboardCount(guildId);
	}

	/**
	 * Set user's XP directly.
	 * @param {string} userId - User ID.
	 * @param {string} guildId - Guild ID.
	 * @param {number} xp - XP amount.
	 * @returns {Promise<Object>} Result object with points, level, oldLevel.
	 */
	async setXP(userId, guildId, xp) {
		return await this.#levelService.setXP(userId, guildId, xp);
	}

	/**
	 * Set user's level directly.
	 * @param {string} userId - User ID.
	 * @param {string} guildId - Guild ID.
	 * @param {number} level - Level amount.
	 * @returns {Promise<Object>} Result object with points, level, oldLevel.
	 */
	async setLevel(userId, guildId, level) {
		return await this.#levelService.setLevel(userId, guildId, level);
	}
}

module.exports = LevelController;
