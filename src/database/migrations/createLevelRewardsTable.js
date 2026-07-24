'use strict';

/**
 * Migration script to create the level_rewards table and indexes.
 * Idempotent - safe to run multiple times.
 */
const { getPool } = require('../connect');

async function createLevelRewardsTable() {
	const db = getPool();
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
}

module.exports = createLevelRewardsTable;
