'use strict';

/**
 * Migration: createLevelRewardsTable
 * Idempotent migration to create the level_rewards table if it doesn't exist.
 * Follows the same pattern as createLevelTable.js.
 */

const getPool = require('../connect').getPool;

/**
 * Creates the level_rewards table with its schema.
 * @param {Object} pool - The PostgreSQL connection pool.
 */
async function createLevelRewardsTable(pool) {
	const db = pool || getPool();

	try {
		await db.query(`
			CREATE TABLE IF NOT EXISTS level_rewards (
				id SERIAL PRIMARY KEY,
				guild_id TEXT NOT NULL,
				level INTEGER NOT NULL,
				role_id TEXT NOT NULL,
				created_at TIMESTAMP DEFAULT NOW(),
				UNIQUE(guild_id, level)
			);
		`);

		console.log('Level rewards table created or already exists');
	}
	catch (err) {
		console.error('Error creating level_rewards table:', err);
		throw err;
	}
}

module.exports = createLevelRewardsTable;