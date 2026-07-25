'use strict';

const IRewardRepository = require('../repositories/IRewardRepository');

let rewardRepository = null;

class RewardService {
	static useRepository(repository) {
		if (!(repository instanceof IRewardRepository)) {
			throw new Error('Invalid repository instance');
		}
		rewardRepository = repository;
	}

	static #guard() {
		if (!rewardRepository) {
			throw new Error('RewardRepository not injected.');
		}
	}

	static async create(guildId, level, roleId) {
		this.#guard();
		return await rewardRepository.create(guildId, level, roleId);
	}

	static async findByGuildAndLevel(guildId, level) {
		this.#guard();
		return await rewardRepository.findByGuildAndLevel(guildId, level);
	}

	static async findById(id) {
		this.#guard();
		return await rewardRepository.findById(id);
	}

	static async findAllByGuild(guildId) {
		this.#guard();
		return await rewardRepository.findAllByGuild(guildId);
	}

	static async deleteById(id) {
		this.#guard();
		return await rewardRepository.deleteById(id);
	}

	static async verifyGuildOwnership(id, guildId) {
		this.#guard();
		return await rewardRepository.verifyGuildOwnership(id, guildId);
	}

	// Helper method for duplicate detection
	static async isDuplicate(guildId, level) {
		const existing = await this.findByGuildAndLevel(guildId, level);
		return !!existing;
	}
}

module.exports = RewardService;
