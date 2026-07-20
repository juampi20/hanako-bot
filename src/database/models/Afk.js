/**
 * Lazily resolve getDb to avoid circular dependency:
 * connect.js → models/index.js → Afk.js → connect.js
 */
function getDb() {
	return require('../connect').getDb();
}

class Afk {
	/**
	 * Create the afk table and indexes.
	 * Called once at startup.
	 */
	static createTable(db) {
		db.exec(`
            CREATE TABLE IF NOT EXISTS afk (
                user_id TEXT NOT NULL,
                guild_id TEXT NOT NULL,
                reason TEXT NOT NULL DEFAULT 'Está ausente',
                started_at INTEGER NOT NULL,
                was_nickname TEXT,
                PRIMARY KEY (user_id, guild_id)
            )
        `);
		db.exec(
			'CREATE INDEX IF NOT EXISTS idx_afk_user_guild ON afk (user_id, guild_id)',
		);
	}

	/**
	 * Set or update an AFK record.
	 */
	static set(userId, guildId, reason, startedAt, wasNickname) {
		const db = getDb();
		db.prepare(
			`INSERT OR REPLACE INTO afk (user_id, guild_id, reason, started_at, was_nickname)
              VALUES (?, ?, ?, ?, ?)`,
		).run(userId, guildId, reason, startedAt, wasNickname);
	}

	/**
	 * Remove an AFK record by user + guild.
	 */
	static remove(userId, guildId) {
		const db = getDb();
		db.prepare('DELETE FROM afk WHERE user_id = ? AND guild_id = ?')
			.run(userId, guildId);
	}

	/**
	 * Check if a user is AFK in a guild.
	 * Returns the record object or null if not found.
	 */
	static isAfk(userId, guildId) {
		const db = getDb();
		const row = db
			.prepare('SELECT user_id, guild_id, reason, started_at, was_nickname FROM afk WHERE user_id = ? AND guild_id = ?')
			.get(userId, guildId);
		return row || null;
	}

	/**
	 * Get all AFK users for a guild.
	 */
	static getAfkUsers(guildId) {
		const db = getDb();
		return db
			.prepare('SELECT user_id, guild_id, reason, started_at, was_nickname FROM afk WHERE guild_id = ?')
			.all(guildId);
	}
}

module.exports = Afk;