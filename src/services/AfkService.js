'use strict';

class AfkService {
	constructor(repository) {
		this.#repository = repository;
	}

	#repository;

	/**
	 * Set or update an AFK record.
	 * @param {string} userId - The user ID.
	 * @param {string} guildId - The guild ID.
	 * @param {string} reason - The AFK reason.
	 * @param {number} startedAt - The start timestamp.
	 * @returns {Promise<Object>} The AFK record.
	 */
	async set(userId, guildId, reason, startedAt) {
		return await this.#repository.set(userId, guildId, reason, startedAt);
	}

	/**
	 * Remove an AFK record by user + guild.
	 * @param {string} userId - The user ID.
	 * @param {string} guildId - The guild ID.
	 * @returns {Promise<Object|null>} The removed record or null.
	 */
	async remove(userId, guildId) {
		return await this.#repository.remove(userId, guildId);
	}

	/**
	 * Check if a user is AFK in a guild.
	 * @param {string} userId - The user ID.
	 * @param {string} guildId - The guild ID.
	 * @returns {Promise<Object|null>} The record or null if not AFK.
	 */
	async isAfk(userId, guildId) {
		return await this.#repository.isAfk(userId, guildId);
	}

	/**
	 * Get all AFK users for a guild.
	 * @param {string} guildId - The guild ID.
	 * @returns {Promise<Array<Object>>} Array of AFK records.
	 */
	async getAfkUsers(guildId) {
		return await this.#repository.getAfkUsers(guildId);
	}

	/**
	 * Remove all AFK records for a guild and return them.
	 * @param {string} guildId - The guild ID.
	 * @returns {Promise<Array<Object>>} Deleted records.
	 */
	async removeAll(guildId) {
		return await this.#repository.removeAll(guildId);
	}
}

module.exports = AfkService;
