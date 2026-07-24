'use strict';

const IRewardRepository = require('../IRewardRepository');

/**
 * Mock implementation of RewardRepository for testing.
 * Uses in-memory storage with Map for fast lookup.
 */
class RewardRepository extends IRewardRepository {
	constructor() {
		super();
		this.rewards = new Map();
		this.nextId = 1;
	}

	async create(guildId, level, roleId) {
		const key = `${guildId}-${level}`;
		if (this.rewards.has(key)) return null;

		const id = this.nextId++;
		const reward = { id, guild_id: guildId, level, role_id: roleId };
		this.rewards.set(key, reward);
		return reward;
	}

	async findByGuildAndLevel(guildId, level) {
		const key = `${guildId}-${level}`;
		return this.rewards.get(key) || null;
	}

	async findById(id) {
		for (const reward of this.rewards.values()) {
			if (reward.id === id) return reward;
		}
		return null;
	}

	async findAllByGuild(guildId) {
		const rewards = Array.from(this.rewards.values())
			.filter(reward => reward.guild_id === guildId)
			.sort((a, b) => a.level - b.level);
		return rewards;
	}

	async deleteById(id) {
		const reward = await this.findById(id);
		if (!reward) return { rowCount: 0 };

		for (const [key, stored] of this.rewards.entries()) {
			if (stored.id === id) {
				this.rewards.delete(key);
				return { rowCount: 1 };
			}
		}
		return { rowCount: 0 };
	}

	async verifyGuildOwnership(id, guildId) {
		const reward = await this.findById(id);
		return reward ? reward.guild_id === guildId : false;
	}
}

module.exports = RewardRepository;
