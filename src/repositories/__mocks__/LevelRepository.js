'use strict';

const ILevelRepository = require('../ILevelRepository');

/**
 * Mock implementation of LevelRepository for testing.
 */
class LevelRepository extends ILevelRepository {
	constructor() {
		super();
		// In-memory score store keyed by `${guildId}-${userId}`
		this.scores = new Map();
	}

	async findByUser(userId, guildId) {
		const key = `${guildId}-${userId}`;
		return this.scores.get(key) || null;
	}

	async upsert(data) {
		const key = `${data.guild}-${data.user}`;
		const existing = this.scores.get(key) || { id: key, user: data.user, guild: data.guild, points: 0, level: 1 };
		const updated = {
			...existing,
			points: data.points,
			level: data.level,
		};
		this.scores.set(key, updated);
		return updated;
	}

	async getLeaderboard(guildId, limit = 10) {
		const guildScores = Array.from(this.scores.values())
			.filter(score => score.guild === guildId)
			.sort((a, b) => b.points - a.points || b.level - a.level)
			.slice(0, limit);
		return guildScores;
	}
}

module.exports = LevelRepository;