'use strict';

/* eslint-disable no-unused-vars */

/**
 * Interface for RewardRepository.
 * Defines the contract for reward persistence operations.
 */
class IRewardRepository {
	/**
   * Creates a new reward assignment for a guild level.
   * @param {string} guildId - Guild ID.
   * @param {number} level - Level for the reward.
   * @param {string} roleId - Discord role ID.
   * @returns {Promise<Object>} The created reward object.
   */
	async create(guildId, level, roleId) {
		throw new Error('Method \'create()\' must be implemented.');
	}

	/**
   * Finds a reward by guild and level.
   * @param {string} guildId - Guild ID.
   * @param {number} level - Level.
   * @returns {Promise<Object|null>} The reward object or null if not found.
   */
	async findByGuildAndLevel(guildId, level) {
		throw new Error('Method \'findByGuildAndLevel()\' must be implemented.');
	}

	/**
   * Finds a reward by its ID.
   * @param {string} id - Reward ID.
   * @returns {Promise<Object|null>} The reward object or null if not found.
   */
	async findById(id) {
		throw new Error('Method \'findById()\' must be implemented.');
	}

	/**
   * Finds all rewards for a guild.
   * @param {string} guildId - Guild ID.
   * @returns {Promise<Array<Object>>} Array of reward objects.
   */
	async findAllByGuild(guildId) {
		throw new Error('Method \'findAllByGuild()\' must be implemented.');
	}

	/**
   * Deletes a reward by ID.
   * @param {string} id - Reward ID.
   * @returns {Promise<Object>} Deletion result.
   */
	async deleteById(id) {
		throw new Error('Method \'deleteById()\' must be implemented.');
	}

	/**
   * Verifies that a reward belongs to a specific guild.
   * @param {string} id - Reward ID.
   * @param {string} guildId - Guild ID.
   * @returns {Promise<boolean>} True if reward belongs to guild, false otherwise.
   */
	async verifyGuildOwnership(id, guildId) {
		throw new Error('Method \'verifyGuildOwnership()\' must be implemented.');
	}
}

module.exports = IRewardRepository;
