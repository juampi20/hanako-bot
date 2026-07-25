'use strict';

/**
* Interface for RewardRepository.
* Defines the contract for reward persistence operations.
*/
class IRewardRepository {
	/**
	 * Creates a new reward row.
	 * @param {string} _guildId - The guild ID.
	 * @param {number} _level - The level.
	 * @param {string} _roleId - The role ID.
	 * @returns {Promise<Object|null>} The created reward object or null if duplicate.
	 */
	async create(_guildId, _level, _roleId) {
		throw new Error('Method \'create()\' must be implemented.');
	}

	/**
	 * Finds a reward by guild and level.
	 * @param {string} _guildId - The guild ID.
	 * @param {number} _level - The level.
	 * @returns {Promise<Object|null>} The reward object or null if not found.
	 */
	async findByGuildAndLevel(_guildId, _level) {
		throw new Error('Method \'findByGuildAndLevel()\' must be implemented.');
	}

	/**
	 * Finds a reward by ID.
	 * @param {number} _id - The reward ID.
	 * @returns {Promise<Object|null>} The reward object or null if not found.
	 */
	async findById(_id) {
		throw new Error('Method \'findById()\' must be implemented.');
	}

	/**
	 * Finds all rewards for a guild.
	 * @param {string} _guildId - The guild ID.
	 * @returns {Promise<Array<Object>>} The reward objects.
	 */
	async findAllByGuild(_guildId) {
		throw new Error('Method \'findAllByGuild()\' must be implemented.');
	}

	/**
	 * Deletes a reward by ID.
	 * @param {number} _id - The reward ID.
	 * @returns {Promise<Object>} Result object with rowCount property.
	 */
	async deleteById(_id) {
		throw new Error('Method \'deleteById()\' must be implemented.');
	}

	/**
	 * Verifies ownership of a reward belongs to a guild.
	 * @param {number} _id - The reward ID.
	 * @param {string} _guildId - The guild ID.
	 * @returns {Promise<boolean>} True if ownership verified.
	 */
	async verifyGuildOwnership(_id, _guildId) {
		throw new Error('Method \'verifyGuildOwnership()\' must be implemented.');
	}
}

module.exports = IRewardRepository;