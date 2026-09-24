'use strict';

/**
 * Migration script to create the guild_config table and indexes.
 * Idempotent - safe to run multiple times.
 */
const { getPool } = require('../connect');

async function createGuildConfigTable() {
	const db = getPool();
	await db.query(`
		CREATE TABLE IF NOT EXISTS guild_config (
			guild_id TEXT NOT NULL,
			key TEXT NOT NULL,
			value TEXT NOT NULL,
			PRIMARY KEY (guild_id, key)
		);
		`);
	await db.query('CREATE INDEX IF NOT EXISTS idx_guild_config_guild_id ON guild_config(guild_id)');
}

module.exports = createGuildConfigTable;