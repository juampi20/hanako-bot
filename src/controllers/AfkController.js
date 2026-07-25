'use strict';

const AfkService = require('../services/AfkService');

/**
 * Set or update an AFK record for the user.
 * @param {string} userId - User ID.
 * @param {string} guildId - Guild ID.
 * @param {string} reason - AFK reason.
 * @returns {Promise<Object>} The AFK record.
 */
async function setAfk(userId, guildId, reason) {
	return await AfkService.set(userId, guildId, reason, Math.floor(Date.now() / 1000));
}

/**
 * Remove an AFK record.
 * @param {string} userId - User ID.
 * @param {string} guildId - Guild ID.
 * @returns {Promise<Object|null>} The removed record or null.
 */
async function removeAfk(userId, guildId) {
	return await AfkService.remove(userId, guildId);
}

/**
 * Check if a user is AFK.
 * @param {string} userId - User ID.
 * @param {string} guildId - Guild ID.
 * @returns {Promise<Object|null>} The record or null.
 */
async function isAfk(userId, guildId) {
	return await AfkService.isAfk(userId, guildId);
}

/**
 * Get all AFK users for a guild.
 * @param {string} guildId - Guild ID.
 * @returns {Promise<Array<Object>>} Array of AFK records.
 */
async function getAfkUsers(guildId) {
	return await AfkService.getAfkUsers(guildId);
}

/**
 * Remove all AFK records for a guild.
 * @param {string} guildId - Guild ID.
 * @returns {Promise<Array<Object>>} Deleted records.
 */
async function removeAllAfk(guildId) {
	return await AfkService.removeAll(guildId);
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
async function resetAfk(guildId, targetUserId = null) {
	if (targetUserId) {
		const record = await isAfk(targetUserId, guildId);

		if (!record) {
			return { success: false, error: 'not_afk' };
		}

		await removeAfk(targetUserId, guildId);

		return { success: true, type: 'user', targetUser: { id: targetUserId, reason: record.reason } };
	}

	const users = await getAfkUsers(guildId);

	if (users.length === 0) {
		return { success: false, error: 'no_users' };
	}

	await removeAllAfk(guildId);

	return { success: true, type: 'all', count: users.length };
}

module.exports = {
	setAfk,
	removeAfk,
	isAfk,
	getAfkUsers,
	removeAllAfk,
	resetAfk,
};