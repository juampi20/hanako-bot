'use strict';

const IScoreRepository = require('./IScoreRepository');

class ScoreRepository extends IScoreRepository {
	constructor(pool) {
		super();
		this.pool = pool;
	}

	/**
     * Create the scores table and indexes.
     */
	async createTable() {
		await this.pool.query(`
            CREATE TABLE IF NOT EXISTS scores (
                id TEXT PRIMARY KEY,
                "user" TEXT NOT NULL,
                guild TEXT NOT NULL,
                points INTEGER NOT NULL DEFAULT 0,
                level INTEGER NOT NULL DEFAULT 1
            )
        `);
		await this.pool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_scores_id ON scores (id)');
	}

	/**
     * Find a score by user + guild.
     * Returns a plain object or null.
     */
	async findByUser(userId, guildId) {
		const res = await this.pool.query(
			'SELECT * FROM scores WHERE "user" = $1 AND guild = $2',
			[userId, guildId],
		);
		return res.rows[0] || null;
	}

	/**
     * Upsert a score row.
     */
	async upsert(data) {
		const res = await this.pool.query(
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
	async getLeaderboard(guildId, limit = 10) {
		const res = await this.pool.query(
			'SELECT * FROM scores WHERE guild = $1 ORDER BY points DESC, level DESC LIMIT $2',
			[guildId, limit],
		);
		return res.rows;
	}
}

module.exports = ScoreRepository;