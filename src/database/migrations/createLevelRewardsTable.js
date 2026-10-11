'use strict';

/**
 * Migration script to create the level_rewards table.
 *
 * Single-guild: a reward exists at most once per `level`, so it becomes the
 * primary key; `id`, `guild_id` and the old `UNIQUE(guild_id, level)` are
 * dropped. Idempotent and safe on both a fresh database (creates the new
 * schema) and an existing database (drops the extra columns and re-keys the
 * primary key without data loss).
 */
const { getPool } = require('../connect');

async function createLevelRewardsTable() {
	const db = getPool();
	await db.query(`
		CREATE TABLE IF NOT EXISTS level_rewards (
			level INTEGER PRIMARY KEY,
			role_id TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT NOW()
		);
	`);
	await db.query('ALTER TABLE level_rewards DROP COLUMN IF EXISTS guild_id');
	await db.query('ALTER TABLE level_rewards DROP COLUMN IF EXISTS id');
	await db.query(`
		DO $$
		BEGIN
			IF NOT EXISTS (
				SELECT 1 FROM pg_constraint
				WHERE conname = 'level_rewards_pkey'
				  AND conrelid = 'level_rewards'::regclass
			) THEN
				ALTER TABLE level_rewards ADD CONSTRAINT level_rewards_pkey PRIMARY KEY (level);
			END IF;
		END $$;
	`);
}

module.exports = createLevelRewardsTable;
