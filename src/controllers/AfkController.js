'use strict';

class AfkController {
	constructor(afkService) {
		this.#afkService = afkService;
	}

	#afkService;

	/**
	 * Set or update an AFK record for the user.
	 * @param {string} userId - User ID.
	 * @param {string} guildId - Guild ID.
	 * @param {string} reason - AFK reason.
	 * @returns {Promise<Object>} The AFK record.
	 */
	async setAfk(userId, guildId, reason) {
		return await this.#afkService.set(userId, guildId, reason, Math.floor(Date.now() / 1000));
	}

	/**
	 * Remove an AFK record.
	 * @param {string} userId - User ID.
	 * @param {string} guildId - Guild ID.
	 * @returns {Promise<Object|null>} The removed record or null.
	 */
	async removeAfk(userId, guildId) {
		return await this.#afkService.remove(userId, guildId);
	}

	/**
	 * Check if a user is AFK.
	 * @param {string} userId - User ID.
	 * @param {string} guildId - Guild ID.
	 * @returns {Promise<Object|null>} The record or null.
	 */
	async isAfk(userId, guildId) {
		return await this.#afkService.isAfk(userId, guildId);
	}

	/**
	 * Get all AFK users for a guild.
	 * @param {string} guildId - Guild ID.
	 * @returns {Promise<Array<Object>>} Array of AFK records.
	 */
	async getAfkUsers(guildId) {
		return await this.#afkService.getAfkUsers(guildId);
	}

	/**
	 * Remove all AFK records for a guild.
	 * @param {string} guildId - Guild ID.
	 * @returns {Promise<Array<Object>>} Deleted records.
	 */
	async removeAllAfk(guildId) {
		return await this.#afkService.removeAll(guildId);
	}

	/**
	 * Reset AFK state for a target user or all users in a guild.
	 * Pure data function — no Discord interaction calls.
	 * @param {string} guildId - Guild ID.
	 * @param {string|null} targetUserId - Optional user ID to reset.
	 * @returns {Promise<Object>} Structured result:
	 *   { success: true, type: 'user', targetUser: { id, reason } }
	 *   { success: true, type: 'all', count: number }
	 *   { success: false, error: 'not_afk' | 'no_users' }
	 */
	async resetAfk(guildId, targetUserId = null) {
		if (targetUserId) {
			const record = await this.isAfk(targetUserId, guildId);

			if (!record) {
				return { success: false, error: 'not_afk' };
			}

			await this.removeAfk(targetUserId, guildId);

			return { success: true, type: 'user', targetUser: { id: targetUserId, reason: record.reason } };
		}

		const users = await this.getAfkUsers(guildId);

		if (users.length === 0) {
			return { success: false, error: 'no_users' };
		}

		await this.removeAllAfk(guildId);

		return { success: true, type: 'all', count: users.length };
	}
}

module.exports = AfkController;
