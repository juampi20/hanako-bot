'use strict';

const IRewardRepository = require('./IRewardRepository');

class RewardRepository extends IRewardRepository {
	constructor(pool) {
		super();
		this.pool = pool;
	}

	async create(guildId, level, roleId) {
		const query = `
      INSERT INTO level_rewards (guild_id, level, role_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (guild_id, level) DO NOTHING
      RETURNING *;
    `;
		const res = await this.pool.query(query, [guildId, level, roleId]);
		return res.rows[0] || null;
	}

	async findByGuildAndLevel(guildId, level) {
		const query = 'SELECT * FROM level_rewards WHERE guild_id = $1 AND level = $2';
		const res = await this.pool.query(query, [guildId, level]);
		return res.rows[0] || null;
	}

	async findById(id) {
		const query = 'SELECT * FROM level_rewards WHERE id = $1';
		const res = await this.pool.query(query, [id]);
		return res.rows[0] || null;
	}

	async findAllByGuild(guildId) {
		const query = 'SELECT * FROM level_rewards WHERE guild_id = $1 ORDER BY level ASC';
		const res = await this.pool.query(query, [guildId]);
		return res.rows;
	}

	async deleteById(id) {
		const query = 'DELETE FROM level_rewards WHERE id = $1 RETURNING id';
		const res = await this.pool.query(query, [id]);
		return { rowCount: res.rowCount > 0 };
	}

	async verifyGuildOwnership(id, guildId) {
		const result = await this.findById(id);
		return result ? result.guild_id === guildId : false;
	}
}

module.exports = RewardRepository;
