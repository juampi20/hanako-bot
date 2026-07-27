'use strict';

class RewardService {
	constructor(repository) {
		this.#repository = repository;
	}

	#repository;

	async create(guildId, level, roleId) {
		return await this.#repository.create(guildId, level, roleId);
	}

	async findByGuildAndLevel(guildId, level) {
		return await this.#repository.findByGuildAndLevel(guildId, level);
	}

	async findById(id) {
		return await this.#repository.findById(id);
	}

	async findAllByGuild(guildId) {
		return await this.#repository.findAllByGuild(guildId);
	}

	async deleteById(id) {
		return await this.#repository.deleteById(id);
	}

	async verifyGuildOwnership(id, guildId) {
		return await this.#repository.verifyGuildOwnership(id, guildId);
	}

	// Helper method for duplicate detection
	async isDuplicate(guildId, level) {
		const existing = await this.findByGuildAndLevel(guildId, level);
		return !!existing;
	}
}

module.exports = RewardService;
