'use strict';

/**
 * Formula: XP needed for level N
 *   xp = 330(N-1)^2 + 300(N-1)
 *
 * Inverted to get level from XP:
 *   k = floor((-300 + sqrt(90000 + 3300*xp)) / 660)
 *   level = max(k + 1, 1)
 */
function getLevelFromXP(xp) {
	if (xp <= 0) {return 1;}
	const k = Math.floor((-300 + Math.sqrt(90000 + 1320 * xp)) / 660);
	return Math.max(k + 1, 1);
}

function getXPForLevel(level) {
	const n = Math.max(level - 1, 0);
	return 330 * n * n + 300 * n;
}

let levelRepository;

class LevelService {
	/**
	 * Initialize the repository.
	 * @param {import('./repositories/ILevelRepository')} repository - The LevelRepository instance implementing ILevelRepository.
	 */
	static useRepository(repository) {
		levelRepository = repository;
	}

	/**
	 * Find a level by user + guild.
	 * Returns a plain object or default if not found.
	 */
	static async findByUser(userId, guildId) {
		if (!levelRepository) throw new Error('LevelRepository not injected.');
		const row = await levelRepository.findByUser(userId, guildId);
		if (row) {
			return {
				id: row.id,
				user: row.user,
				guild: row.guild,
				points: row.points,
				level: getLevelFromXP(row.points),
			};
		}
		return {
			id: `${guildId}-${userId}`,
			user: userId,
			guild: guildId,
			points: 0,
			level: 1,
		};
	}

	/**
	 * Upsert a level row.
	 */
	static async upsert(data) {
		if (!levelRepository) throw new Error('LevelRepository not injected.');
		return await levelRepository.upsert(data);
	}

	/**
	 * Get the top N levels for a guild.
	 */
	static async getLeaderboard(guildId, limit = 10) {
		if (!levelRepository) throw new Error('LevelRepository not injected.');
		const rows = await levelRepository.getLeaderboard(guildId, limit);
		return rows.map((row) => ({
			id: row.id,
			user: row.user,
			guild: row.guild,
			points: row.points,
			level: getLevelFromXP(row.points),
		}));
	}

	/**
	 * Add XP to a user's level and recalculate level.
	 * Returns the updated level object with oldLevel, or null if amount is invalid.
	 */
	static async addXP(userId, guildId, amount) {
		if (!amount || amount <= 0) return null;

		const current = await this.findByUser(userId, guildId);
		const newPoints = current.points + amount;
		const newLevel = getLevelFromXP(newPoints);
		const oldLevel = current.level;

		await this.upsert({
			id: current.id,
			user: current.user,
			guild: current.guild,
			points: amount,
			level: newLevel,
		});

		return {
			id: current.id,
			user: current.user,
			guild: current.guild,
			points: newPoints,
			level: newLevel,
			oldLevel,
		};
	}

	/** Set XP directly, recalculate level. Can go up or down. */
	static async setXP(userId, guildId, xp) {
		if (xp < 0) return null;
		const current = await this.findByUser(userId, guildId);
		const oldLevel = current.level;
		const newLevel = getLevelFromXP(xp);

		await this.upsert({
			id: current.id,
			user: current.user,
			guild: current.guild,
			points: xp,
			level: newLevel,
		});

		return { points: xp, level: newLevel, oldLevel };
	}

	/** Set level directly, compute minimum XP for that level. */
	static async setLevel(userId, guildId, level) {
		if (level < 1) return null;
		const minXP = getXPForLevel(level);
		const current = await this.findByUser(userId, guildId);
		const oldLevel = current.level;

		await this.upsert({
			id: current.id,
			user: current.user,
			guild: current.guild,
			points: minXP,
			level: level,
		});

		return { points: minXP, level, oldLevel };
	}

	// ── Compatibility aliases ────────────────────────────
	// These match the method names used by existing commands.

	/** Alias for findByUser — used by rank command */
	static async getScore(userId, guildId) {
		return this.findByUser(userId, guildId);
	}

	/** Expose formula — used by rank command */
	static getXPForLevel(level) {
		return getXPForLevel(level);
	}

	/** Expose inverse formula — used internally and by tests */
	static getLevelFromXP(xp) {
		return getLevelFromXP(xp);
	}
}

module.exports = LevelService;