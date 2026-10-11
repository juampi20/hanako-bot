'use strict';

/**
 * Migration script to create the scores table.
 *
 * Single-guild: scores are keyed by `user` alone, so `id`, `guild` and `level`
 * (derived from `points`) are dropped. Idempotent and safe on both a fresh
 * database (creates the new schema) and an existing database (drops the extra
 * columns and re-keys the primary key without data loss).
 */
const { getPool } = require('../connect');

async function createLevelTable() {
	const pool = getPool();
	try {
		console.log('Creating table scores if not exists...');
		await pool.query(`
			CREATE TABLE IF NOT EXISTS scores (
				"user" TEXT PRIMARY KEY,
				points INTEGER NOT NULL DEFAULT 0
			)
		`);
		console.log('Table scores created successfully');

		await pool.query('ALTER TABLE scores DROP COLUMN IF EXISTS guild');
		await pool.query('ALTER TABLE scores DROP COLUMN IF EXISTS level');
		await pool.query('ALTER TABLE scores DROP COLUMN IF EXISTS id');
		await pool.query('DROP INDEX IF EXISTS idx_scores_id');
		await pool.query(`
			DO $$
			BEGIN
				IF NOT EXISTS (
					SELECT 1 FROM pg_constraint
					WHERE conname = 'scores_pkey'
					  AND conrelid = 'scores'::regclass
				) THEN
					ALTER TABLE scores ADD CONSTRAINT scores_pkey PRIMARY KEY ("user");
				END IF;
			END $$;
		`);
	}
	catch (error) {
		console.error('Error creating table/index:', error);
		throw error;
	}
}

module.exports = createLevelTable;
