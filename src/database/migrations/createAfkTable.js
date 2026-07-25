'use strict';

/**
 * Migration script to create the afk table and indexes.
 * Idempotent - safe to run multiple times.
 */
const { getPool } = require('../connect');

async function createAfkTable() {
	const db = getPool();
	await db.query(`
		CREATE TABLE IF NOT EXISTS afk (
			user_id TEXT NOT NULL,
			guild_id TEXT NOT NULL,
			reason TEXT NOT NULL DEFAULT 'Está ausente',
			started_at INTEGER NOT NULL,
			PRIMARY KEY (user_id, guild_id)
		);
	`);
	await db.query('CREATE INDEX IF NOT EXISTS idx_afk_user_guild ON afk (user_id, guild_id)');
}

module.exports = createAfkTable;