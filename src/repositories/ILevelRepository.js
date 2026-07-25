'use strict';

/**
 * Interface for LevelRepository.
 * Defines the contract for level persistence operations.
 */
class ILevelRepository {
	/**
	 * Finds a level by user ID and guild ID.
	 * @param {string} _userId - The user ID.
	 * @param {string} _guildId - The guild ID.
	 * @returns {Promise<Object|null>} The level object or null if not found.
	 */
	async findByUser(_userId, _guildId) {
		throw new Error('Method \'findByUser()\' must be implemented.');
	}

	/**
	 * Upserts a level row.
	 * @param {Object} _data - The level data to upsert.
	 * @returns {Promise<Object>} The upserted level object.
	 */
	async upsert(_data) {
		throw new Error('Method \'upsert()\' must be implemented.');
	}

	/**
	 * Gets the leaderboard for a guild.
	 * @param {string} guildId - The guild ID.
	 * @param {number} [_limit=10] - The maximum number of levels to return.
	 * @param {number} [_offset=0] - The number of levels to skip.
	 * @returns {Promise<Array<Object>>} The leaderboard levels.
	 */
	async getLeaderboard(guildId, _limit = 10, _offset = 0) {
		throw new Error('Method \'getLeaderboard()\' must be implemented.');
	}

	/**
	 * Gets the total count of levels for a guild.
	 * @param {string} guildId - The guild ID.
	 * @returns {Promise<number>} The total count.
	 */
	async getLeaderboardCount(_guildId) {
		throw new Error('Method \'getLeaderboardCount()\' must be implemented.');
	}
}

module.exports = ILevelRepository;