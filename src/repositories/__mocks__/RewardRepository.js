'use strict';

const IRewardRepository = require('../IRewardRepository');

/**
 * In-memory mock implementation of RewardRepository for unit testing.
 * No database dependency, supports the same operations as the real repo.
 */
class RewardRepository extends IRewardRepository {
	constructor() {
		super();
		// Primary key: `${guildId}-${level}`
		this.map = new Map();
		this.counter = 0;
	}

	async create(guildId, level, roleId) {
		const key = `${guildId}-${level}`;

		// Simulate duplicate key violation - return null as the real implementation does
		if (this.map.has(key)) {
			return null;
		}

		const id = ++this.counter;
		const reward = {
			id,
			guild_id: guildId,
			level,
			role_id: roleId,
			created_at: new Date().toISOString(),
		};
		this.map.set(key, reward);
		return reward;
	}

	async findByGuildAndLevel(guildId, level) {
		const key = `${guildId}-${level}`;
		return this.map.get(key) || null;
	}

	async findById(id) {
		for (const reward of this.map.values()) {
			if (reward.id === id) return reward;
		}
		return null;
	}

	async findAllByGuild(guildId) {
		const rewards = [];
		for (const reward of this.map.values()) {
			if (reward.guild_id === guildId) rewards.push(reward);
		}
		return rewards.sort((a, b) => a.level - b.level);
	}

	async deleteById(id) {
		let deleted = false;
		for (const [key, reward] of this.map.entries()) {
			if (reward.id === id) {
				this.map.delete(key);
				deleted = true;
			}
		}
		return { rowCount: deleted ? 1 : 0 };
	}

	async verifyGuildOwnership(id, guildId) {
		const reward = await this.findById(id);
		return reward && reward.guild_id === guildId;
	}
}

module.exports = RewardRepository;