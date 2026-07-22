function getPool() {
	return require('../connect').getPool();
}

class Reward {
	static async createTable(pool) {
		const db = pool || getPool();
		await db.query('CREATE TABLE IF NOT EXISTS level_rewards (id SERIAL PRIMARY KEY, guild_id TEXT NOT NULL, level INTEGER NOT NULL, role_id TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW(), UNIQUE(guild_id, level))');
	}

	static async create(guildId, level, roleId) {
		const db = getPool();
		try {
			const res = await db.query('INSERT INTO level_rewards (guild_id, level, role_id) VALUES ($1, $2, $3) RETURNING *', [guildId, level, roleId]);
			return res.rows[0];
		}
		catch (err) {
			if (err.code === '23505') { return null; }
			throw err;
		}
	}

	static async findByGuildAndLevel(guildId, level) {
		const db = getPool();
		const res = await db.query('SELECT * FROM level_rewards WHERE guild_id = $1 AND level = $2', [guildId, level]);
		return res.rows[0] || undefined;
	}

	static async findById(id) {
		const db = getPool();
		const res = await db.query('SELECT * FROM level_rewards WHERE id = $1', [id]);
		return res.rows[0] || undefined;
	}

	static async findAllByGuild(guildId) {
		const db = getPool();
		const res = await db.query('SELECT * FROM level_rewards WHERE guild_id = $1 ORDER BY level ASC', [guildId]);
		return res.rows;
	}

	static async deleteById(id) {
		const db = getPool();
		const res = await db.query('DELETE FROM level_rewards WHERE id = $1 RETURNING id', [id]);
		return { rowCount: res.rowCount > 0 };
	}

	static async verifyGuildOwnership(id, guildId) {
		const res = await this.findById(id);
		return res && res.guild_id === guildId;
	}
}

module.exports = Reward;
