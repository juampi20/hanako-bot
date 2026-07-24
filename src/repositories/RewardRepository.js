'use strict';

const IRewardRepository = require('./IRewardRepository');

class RewardRepository extends IRewardRepository {
	constructor(pool) {
		super();
		this.pool = pool;
	}

	/**
	 * Creates a new reward row.
	 * @param {string} guildId - The guild ID.
	 * @param {number} level - The level.
	 * @param {string} roleId - The role ID.
	 * @returns {Promise<Object|null>} The created reward object or null if duplicate.
	 */
	async create(guildId, level, roleId) {
		try {
			const res = await this.pool.query(
				'INSERT INTO level_rewards (guild_id, level, role_id) VALUES ($1, $2, $3) RETURNING *',
				[guildId, level, roleId],
			);
			return res.rows[0];
		}
		catch (err) {
			if (err.code === '23505') { return null; }
			throw err;
		}
	}

	/**
	 * Finds a reward by guild and level.
	 * @param {string} guildId - The guild ID.
	 * @param {number} level - The level.
	 * @returns {Promise<Object|null>} The reward object or undefined if not found.
	 */
	async findByGuildAndLevel(guildId, level) {
		const res = await this.pool.query(
			'SELECT * FROM level_rewards WHERE guild_id = $1 AND level = $2',
			[guildId, level],
		);
		return res.rows[0] || null;
	}

	/**
	 * Finds a reward by ID.
	 * @param {number} id - The reward ID.
	 * @returns {Promise<Object|null>} The reward object or undefined if not found.
	 */
	async findById(id) {
		const res = await this.pool.query(
			'SELECT * FROM level_rewards WHERE id = $1',
			[id],
		);
		return res.rows[0] || null;
	}

	/**
	 * Finds all rewards for a guild ordered by level ascending.
	 * @param {string} guildId - The guild ID.
	 * @returns {Promise<Array<Object>>} The reward objects.
	 */
	async findAllByGuild(guildId) {
		const res = await this.pool.query(
			'SELECT * FROM level_rewards WHERE guild_id = $1 ORDER BY level ASC',
			[guildId],
		);
		return res.rows;
	}

	/**
	 * Deletes a reward by ID.
	 * @param {number} id - The reward ID.
	 * @returns {Promise<Object>} Result object with rowCount property.
	 */
	async deleteById(id) {
		const res = await this.pool.query(
			'DELETE FROM level_rewards WHERE id = $1 RETURNING id',
			[id],
		);
		return { rowCount: res.rowCount > 0 };
	}

	/**
	 * Verifies ownership of a reward belongs to a guild.
	 * @param {number} id - The reward ID.
	 * @param {string} guildId - The guild ID.
	 * @returns {Promise<boolean>} True if ownership verified.
	 */
	async verifyGuildOwnership(id, guildId) {
		const reward = await this.findById(id);
		return reward && reward.guild_id === guildId;
	}
}

module.exports = RewardRepository;
