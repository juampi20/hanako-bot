'use strict';

/**
 * Interface for ScoreRepository.
 * Defines the contract for score persistence operations.
 */
class IScoreRepository {
	/**
     * Creates the scores table and indexes if they don't exist.
     */
	async createTable() {
		throw new Error('Method \'createTable()\' must be implemented.');
	}

	/**
     * Finds a score by user ID and guild ID.
	 * @param {string} _userId - The user ID.
	 * @param {string} _guildId - The guild ID.
	 * @returns {Promise<Object|null>} The score object or null if not found.
	 */
	async findByUser(_userId, _guildId) {
		throw new Error('Method \'findByUser()\' must be implemented.');
	}

	/**
     * Upserts a score row.
	 * @param {Object} _data - The score data to upsert.
	 * @returns {Promise<Object>} The upserted score object.
	 */
	async upsert(_data) {
		throw new Error('Method \'upsert()\' must be implemented.');
	}

	/**
     * Gets the leaderboard for a guild.
     * @param {string} guildId - The guild ID.
	 * @param {number} [_limit=10] - The maximum number of scores to return.
	 * @returns {Promise<Array<Object>>} The leaderboard scores.
	 */
	async getLeaderboard(guildId, _limit = 10) {
		throw new Error('Method \'getLeaderboard()\' must be implemented.');
	}
}

module.exports = IScoreRepository;