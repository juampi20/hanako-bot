'use strict';

const IAfkRepository = require('./IAfkRepository');

/**
 * AFKRepository implementation for PostgreSQL.
 * Includes exact SQL matching the legacy Afk.js model.
 */
class AfkRepository extends IAfkRepository {
	#pool;

	constructor(pool) {
		super();
		this.#pool = pool;
	}

	/**
	 * Set or update an AFK record (INSERT ... ON CONFLICT DO UPDATE)
	 */
	async set(userId, guildId, reason, startedAt) {
		try {
			const sql = `
				INSERT INTO afk (user_id, guild_id, reason, started_at)
				VALUES ($1, $2, $3, $4)
				ON CONFLICT (user_id, guild_id) DO UPDATE SET reason = $3, started_at = $4
				RETURNING *`;
			const res = await this.#pool.query(sql, [userId, guildId, reason, startedAt]);
			return res.rows[0] || null;
		}
		catch (error) {
			throw new Error(`Failed to set AFK record for user ${userId}, guild ${guildId}: ${error.message}`, { cause: error });
		}
	}

	/**
	 * Remove an AFK record by user + guild.
	 */
	async remove(userId, guildId) {
		try {
			const sql = 'DELETE FROM afk WHERE user_id = $1 AND guild_id = $2 RETURNING *';
			const res = await this.#pool.query(sql, [userId, guildId]);
			return res.rows[0] || null;
		}
		catch (error) {
			throw new Error(`Failed to remove AFK record for user ${userId}, guild ${guildId}: ${error.message}`, { cause: error });
		}
	}

	/**
	 * Check if a user is AFK in a guild.
	 */
	async isAfk(userId, guildId) {
		try {
			const sql = 'SELECT * FROM afk WHERE user_id = $1 AND guild_id = $2';
			const res = await this.#pool.query(sql, [userId, guildId]);
			return res.rows[0] || null;
		}
		catch (error) {
			throw new Error(`Failed to check AFK status for user ${userId}, guild ${guildId}: ${error.message}`, { cause: error });
		}
	}

	/**
	 * Get all AFK users for a guild.
	 */
	async getAfkUsers(guildId) {
		try {
			const sql = 'SELECT * FROM afk WHERE guild_id = $1';
			const res = await this.#pool.query(sql, [guildId]);
			return res.rows;
		}
		catch (error) {
			throw new Error(`Failed to get AFK users for guild ${guildId}: ${error.message}`, { cause: error });
		}
	}

	/**
	 * Remove all AFK records for a guild and return them.
	 */
	async removeAll(guildId) {
		try {
			const sql = 'DELETE FROM afk WHERE guild_id = $1 RETURNING *';
			const res = await this.#pool.query(sql, [guildId]);
			return res.rows;
		}
		catch (error) {
			throw new Error(`Failed to remove all AFK records for guild ${guildId}: ${error.message}`, { cause: error });
		}
	}
}

module.exports = AfkRepository;