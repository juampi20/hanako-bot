'use strict';

/**
 * Interface for AfkRepository.
 * Defines the contract for AFK persistence operations.
 */
class IAfkRepository {
	/**
	 * Set or update an AFK record.
	 * @param {string} _userId - The user ID.
	 * @param {string} _guildId - The guild ID.
	 * @param {string} _reason - The AFK reason.
	 * @param {number} _startedAt - The start timestamp.
	 * @returns {Promise<Object>} The AFK record.
	 */
	async set(_userId, _guildId, _reason, _startedAt) {
		throw new Error('Method \'set()\' must be implemented.');
	}

	/**
	 * Remove an AFK record by user + guild.
	 * @param {string} _userId - The user ID.
	 * @param {string} _guildId - The guild ID.
	 * @returns {Promise<Object|null>} The removed record or null.
	 */
	async remove(_userId, _guildId) {
		throw new Error('Method \'remove()\' must be implemented.');
	}

	/**
	 * Check if a user is AFK in a guild.
	 * @param {string} _userId - The user ID.
	 * @param {string} _guildId - The guild ID.
	 * @returns {Promise<Object|null>} The record or null if not AFK.
	 */
	async isAfk(_userId, _guildId) {
		throw new Error('Method \'isAfk()\' must be implemented.');
	}

	/**
	 * Get all AFK users for a guild.
	 * @param {string} _guildId - The guild ID.
	 * @returns {Promise<Array<Object>>} Array of AFK records.
	 */
	async getAfkUsers(_guildId) {
		throw new Error('Method \'getAfkUsers()\' must be implemented.');
	}

	/**
	 * Remove all AFK records for a guild and return them.
	 * @param {string} _guildId - The guild ID.
	 * @returns {Promise<Array<Object>>} Deleted records.
	 */
	async removeAll(_guildId) {
		throw new Error('Method \'removeAll()\' must be implemented.');
	}
}

module.exports = IAfkRepository;