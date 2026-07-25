'use strict';

/**
 * AfkService - Static module service for AFK operations.
 * Uses repository injection pattern for decoupled operations.
 */
let repository = null;

/**
 * Initialize the repository for this service.
 * @param {import('./repositories/AfkRepository')} repo - The repository instance.
 */
function useRepository(repo) {
	repository = repo;
}

/**
 * Reset the repository (for testing).
 */
function clearRepository() {
	repository = null;
}

/**
 * Set or update an AFK record.
 * @param {string} userId - The user ID.
 * @param {string} guildId - The guild ID.
 * @param {string} reason - The AFK reason.
 * @param {number} startedAt - The start timestamp.
 * @returns {Promise<Object>} The AFK record.
 */
async function set(userId, guildId, reason, startedAt) {
	if (!repository) throw new Error('AfkRepository not injected.');
	return await repository.set(userId, guildId, reason, startedAt);
}

/**
 * Remove an AFK record by user + guild.
 * @param {string} userId - The user ID.
 * @param {string} guildId - The guild ID.
 * @returns {Promise<Object|null>} The removed record or null.
 */
async function remove(userId, guildId) {
	if (!repository) throw new Error('AfkRepository not injected.');
	return await repository.remove(userId, guildId);
}

/**
 * Check if a user is AFK in a guild.
 * @param {string} userId - The user ID.
 * @param {string} guildId - The guild ID.
 * @returns {Promise<Object|null>} The record or null if not AFK.
 */
async function isAfk(userId, guildId) {
	if (!repository) throw new Error('AfkRepository not injected.');
	return await repository.isAfk(userId, guildId);
}

/**
 * Get all AFK users for a guild.
 * @param {string} guildId - The guild ID.
 * @returns {Promise<Array<Object>>} Array of AFK records.
 */
async function getAfkUsers(guildId) {
	if (!repository) throw new Error('AfkRepository not injected.');
	return await repository.getAfkUsers(guildId);
}

/**
 * Remove all AFK records for a guild and return them.
 * @param {string} guildId - The guild ID.
 * @returns {Promise<Array<Object>>} Deleted records.
 */
async function removeAll(guildId) {
	if (!repository) throw new Error('AfkRepository not injected.');
	return await repository.removeAll(guildId);
}

module.exports = { useRepository, clearRepository, set, remove, isAfk, getAfkUsers, removeAll };