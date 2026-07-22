/**
 * Lazily resolve getPool to avoid circular dependency:
 * connect.js → models/index.js → Score.js → connect.js
 */
function getPool() {
	return require('../connect').getPool();
}

/**
 * Formula: XP needed for level N
 *   xp = 330(N-1)^2 + 300(N-1)
 *
 * Inverted to get level from XP:
 *   k = floor((-300 + sqrt(90000 + 1320*xp)) / 660)
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

class Score {
	/**
     * Create the scores table and indexes.
     * Called once at startup.
     */
	static async createTable(pool) {
		const db = pool || getPool();
		await db.query(`
            CREATE TABLE IF NOT EXISTS scores (
                id TEXT PRIMARY KEY,
                "user" TEXT NOT NULL,
                guild TEXT NOT NULL,
                points INTEGER NOT NULL DEFAULT 0,
                level INTEGER NOT NULL DEFAULT 1
            )
        `);
		await db.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_scores_id ON scores (id)');
	}

	/**
     * Find a score by user + guild.
     * Returns a plain object or null.
     */
	static async findByUser(userId, guildId) {
		const db = getPool();
		const res = await db.query(
			'SELECT * FROM scores WHERE "user" = $1 AND guild = $2',
			[userId, guildId],
		);
		const row = res.rows[0];

		if (row) {
			return {
				id: row.id,
				user: row.user,
				guild: row.guild,
				points: row.points,
				// recalculate from points
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
	 * Upsert a score row.
	 */
	static async upsert(data) {
		const db = getPool();
		const res = await db.query(
		    `INSERT INTO scores (id, "user", guild, points, level)
	             VALUES ($1, $2, $3, $4, $5)
	             ON CONFLICT (id) DO UPDATE SET points = scores.points + EXCLUDED.points, level = EXCLUDED.level
	             RETURNING *`,
		    [data.id, data.user, data.guild, data.points, data.level],
		);
		return res.rows[0];
	}

	/**
	 * Get the top N scores for a guild.
	 */
	static async getLeaderboard(guildId, limit = 10) {
		const db = getPool();
		const res = await db.query(
			'SELECT * FROM scores WHERE guild = $1 ORDER BY points DESC, level DESC LIMIT $2',
			[guildId, limit],
		);
		return res.rows.map((row) => ({
			id: row.id,
			user: row.user,
			guild: row.guild,
			points: row.points,
			// recalculate from points
			level: getLevelFromXP(row.points),
		}));
	}

	/**
	 * Add XP to a user's score and recalculate level.
	 * Returns the updated score object with oldLevel, or null if amount is invalid.
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
}

module.exports = Score;
