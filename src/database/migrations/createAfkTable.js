'use strict';

/**
 * Migration script to create the afk table.
 *
 * Single-guild: a user is AFK at most once, so the primary key is `user_id`
 * alone. Idempotent and safe on both a fresh database (creates the new schema)
 * and an existing database (drops `guild_id` and re-keys the primary key
 * without data loss).
 */
const { getPool } = require('../connect');

async function createAfkTable() {
	const db = getPool();
	await db.query(`
		CREATE TABLE IF NOT EXISTS afk (
			user_id TEXT PRIMARY KEY,
			reason TEXT,
			started_at INTEGER
		);
	`);
	await db.query('ALTER TABLE afk DROP COLUMN IF EXISTS guild_id');
	await db.query(`
		DO $$
		BEGIN
			IF NOT EXISTS (
				SELECT 1 FROM pg_constraint
				WHERE conname = 'afk_pkey'
				  AND conrelid = 'afk'::regclass
			) THEN
				ALTER TABLE afk ADD CONSTRAINT afk_pkey PRIMARY KEY (user_id);
			END IF;
		END $$;
	`);
}

module.exports = createAfkTable;
