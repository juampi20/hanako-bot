'use strict';

const ILevelRepository = require('./ILevelRepository');

class LevelRepository extends ILevelRepository {
	constructor(pool) {
		super();
		this.pool = pool;
	}

	/**
	 * Finds a level by user + guild.
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
	 * Upserts a level row.
	 */
	async upsert(data) {
		const res = await this.pool.query(
			`INSERT INTO scores (id, "user", guild, points, level)
                  VALUES ($1, $2, $3, $4, $5)
                  ON CONFLICT (id) DO UPDATE SET points = EXCLUDED.points, level = EXCLUDED.level
                  RETURNING *`,
			[data.id, data.user, data.guild, data.points, data.level],
		);
		return res.rows[0];
	}

	/**
	 * Get the top N levels for a guild.
	 */
	async getLeaderboard(guildId, limit = 10) {
		const res = await this.pool.query(
			'SELECT * FROM scores WHERE guild = $1 ORDER BY points DESC, level DESC LIMIT $2',
			[guildId, limit],
		);
		return res.rows;
	}
}

module.exports = LevelRepository;