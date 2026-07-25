'use strict';

/**
* RewardService — static CRUD service layer for level rewards.
* Follows the same DI pattern as LevelService but with pure delegation.
*/

let rewardRepository;

class RewardService {
	/**
	 * Inject the repository instance.
	 * @param {import('./repositories/IRewardRepository')} repository - The RewardRepository instance implementing IRewardRepository.
	 */
	static useRepository(repository) {
		rewardRepository = repository;
	}

	/**
	 * Create a new reward row.
	 * @param {string} guildId - The guild ID.
	 * @param {number} level - The level.
	 * @param {string} roleId - The role ID.
	 * @returns {Promise<Object|null>} The created reward object or null if duplicate.
	 */
	static async create(guildId, level, roleId) {
		if (!rewardRepository) throw new Error('RewardRepository not injected.');
		return await rewardRepository.create(guildId, level, roleId);
	}

	/**
	 * Find a reward by guild and level.
	 * @param {string} guildId - The guild ID.
	 * @param {number} level - The level.
	 * @returns {Promise<Object|null>} The reward object or null if not found.
	 */
	static async findByGuildAndLevel(guildId, level) {
		if (!rewardRepository) throw new Error('RewardRepository not injected.');
		return await rewardRepository.findByGuildAndLevel(guildId, level);
	}

	/**
	 * Find a reward by ID.
	 * @param {number} id - The reward ID.
	 * @returns {Promise<Object|null>} The reward object or null if not found.
	 */
	static async findById(id) {
		if (!rewardRepository) throw new Error('RewardRepository not injected.');
		return await rewardRepository.findById(id);
	}

	/**
	 * Find all rewards for a guild.
	 * @param {string} guildId - The guild ID.
	 * @returns {Promise<Array<Object>>} The reward objects sorted by level ascending.
	 */
	static async findAllByGuild(guildId) {
		if (!rewardRepository) throw new Error('RewardRepository not injected.');
		return await rewardRepository.findAllByGuild(guildId);
	}

	/**
	 * Delete a reward by ID.
	 * @param {number} id - The reward ID.
	 * @returns {Promise<Object>} Result object with rowCount property.
	 */
	static async deleteById(id) {
		if (!rewardRepository) throw new Error('RewardRepository not injected.');
		return await rewardRepository.deleteById(id);
	}

	/**
	 * Verify ownership of a reward belongs to a guild.
	 * @param {number} id - The reward ID.
	 * @param {string} guildId - The guild ID.
	 * @returns {Promise<boolean>} True if ownership verified.
	 */
	static async verifyGuildOwnership(id, guildId) {
		if (!rewardRepository) throw new Error('RewardRepository not injected.');
		return await rewardRepository.verifyGuildOwnership(id, guildId);
	}
}

module.exports = RewardService;