function getPool() {
	return require('../connect').getPool();
}

class Afk {
	/**
     * Create the afk table and indexes.
     * Called once at startup.
     */
	static async createTable(pool) {
		const db = pool || getPool();
		await db.query(`
            CREATE TABLE IF NOT EXISTS afk (
                user_id TEXT NOT NULL,
                guild_id TEXT NOT NULL,
                reason TEXT NOT NULL DEFAULT 'Está ausente',
                started_at INTEGER NOT NULL,
                PRIMARY KEY (user_id, guild_id)
            )
        `);
		await db.query('CREATE INDEX IF NOT EXISTS idx_afk_user_guild ON afk (user_id, guild_id)');
	}

	/**
     * Set or update an AFK record.
     */
	static async set(userId, guildId, reason, startedAt) {
		const db = getPool();
		const res = await db.query(
			`INSERT INTO afk (user_id, guild_id, reason, started_at) VALUES ($1, $2, $3, $4)
             ON CONFLICT (user_id, guild_id) DO UPDATE SET reason = $3, started_at = $4
             RETURNING *`,
			[userId, guildId, reason, startedAt],
		);
		return res.rows[0];
	}

	/**
     * Remove an AFK record by user + guild.
     */
	static async remove(userId, guildId) {
		const db = getPool();
		const res = await db.query('DELETE FROM afk WHERE user_id = $1 AND guild_id = $2 RETURNING *', [userId, guildId]);
		return res.rows[0] || null;
	}

	/**
     * Check if a user is AFK in a guild.
     * Returns the record object or null if not found.
     */
	static async isAfk(userId, guildId) {
		const db = getPool();
		const res = await db.query('SELECT * FROM afk WHERE user_id = $1 AND guild_id = $2', [userId, guildId]);
		return res.rows[0] || null;
	}

	/**
     * Get all AFK users for a guild.
     */
	static async getAfkUsers(guildId) {
		const db = getPool();
		const res = await db.query('SELECT * FROM afk WHERE guild_id = $1', [guildId]);
		return res.rows;
	}

	/**
     * Remove all AFK records for a guild and return the rows that were deleted.
     * Used for bulk reset and nickname restoration.
     */
	static async removeAll(guildId) {
		const db = getPool();
		const res = await db.query('DELETE FROM afk WHERE guild_id = $1 RETURNING *', [guildId]);
		return res.rows;
	}
}

module.exports = Afk;