'use strict';

/**
 * Migration script to create the birthdays table.
 *
 * Single-guild: `user_id` stays the primary key and the `guild_id` column is
 * dropped. Idempotent and safe on both a fresh database (creates the new
 * schema) and an existing database (drops `guild_id` without data loss).
 */
const { getPool } = require('../connect');

async function createBirthdaysTable() {
	const db = getPool();
	await db.query(`
		CREATE TABLE IF NOT EXISTS birthdays (
			user_id TEXT PRIMARY KEY,
			birthday DATE NOT NULL,
			timezone TEXT NOT NULL DEFAULT 'UTC',
			ping BOOLEAN NOT NULL DEFAULT false
		);
	`);
	await db.query('ALTER TABLE birthdays ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT \'UTC\'');
	await db.query('ALTER TABLE birthdays ADD COLUMN IF NOT EXISTS ping BOOLEAN NOT NULL DEFAULT false');
	await db.query('ALTER TABLE birthdays DROP COLUMN IF EXISTS guild_id');
}

module.exports = createBirthdaysTable;
