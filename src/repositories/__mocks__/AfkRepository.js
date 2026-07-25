'use strict';

/**
 * Mock implementation of AfkRepository for testing.
 * Uses in-memory Map keyed by `${userId}:${guildId}`.
 */
class AfkRepository {
	constructor() {
		this.records = new Map();
	}

	async set(userId, guildId, reason, startedAt) {
		const key = `${userId}:${guildId}`;
		const record = {
			user_id: userId,
			guild_id: guildId,
			reason,
			started_at: startedAt,
		};
		this.records.set(key, record);
		return record;
	}

	async remove(userId, guildId) {
		const key = `${userId}:${guildId}`;
		const record = this.records.get(key);
		if (record) {
			this.records.delete(key);
			return record;
		}
		return null;
	}

	async isAfk(userId, guildId) {
		const key = `${userId}:${guildId}`;
		return this.records.get(key) || null;
	}

	async getAfkUsers(guildId) {
		const users = [];
		for (const record of this.records.values()) {
			if (record.guild_id === guildId) {
				users.push(record);
			}
		}
		return users;
	}

	async removeAll(guildId) {
		const deleted = [];
		for (const [key, record] of this.records.entries()) {
			if (record.guild_id === guildId) {
				this.records.delete(key);
				deleted.push(record);
			}
		}
		return deleted;
	}
}

module.exports = AfkRepository;