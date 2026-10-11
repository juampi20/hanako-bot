'use strict';

/**
 * Migration script to create the guild_config table.
 *
 * Single-guild: config is keyed by `key` alone. The migration is idempotent and
 * safe on both a fresh database (creates the new schema) and an existing
 * database (drops `guild_id` and re-keys the primary key without data loss).
 */
const { getPool } = require('../connect');

async function createGuildConfigTable() {
	const db = getPool();
	await db.query(`
		CREATE TABLE IF NOT EXISTS guild_config (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL
		);
	`);
	await db.query('ALTER TABLE guild_config DROP COLUMN IF EXISTS guild_id');
	await db.query(`
		DO $$
		BEGIN
			IF NOT EXISTS (
				SELECT 1 FROM pg_constraint
				WHERE conname = 'guild_config_pkey'
				  AND conrelid = 'guild_config'::regclass
			) THEN
				ALTER TABLE guild_config ADD CONSTRAINT guild_config_pkey PRIMARY KEY (key);
			END IF;
		END $$;
	`);
}

module.exports = createGuildConfigTable;
