'use strict';

/**
 * Migration script to create the birthdays table and indexes.
 * Idempotent - safe to run multiple times.
 */
const { getPool } = require('../connect');

async function createBirthdaysTable() {
	const db = getPool();
	await db.query(`
		CREATE TABLE IF NOT EXISTS birthdays (
			user_id TEXT NOT NULL,
			guild_id TEXT NOT NULL,
			birthday DATE NOT NULL,
			timezone TEXT NOT NULL DEFAULT 'UTC',
			ping BOOLEAN NOT NULL DEFAULT false,
			PRIMARY KEY (user_id)
		);
	`);
	await db.query('ALTER TABLE birthdays ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT \'UTC\'');
	await db.query('ALTER TABLE birthdays ADD COLUMN IF NOT EXISTS ping BOOLEAN NOT NULL DEFAULT false');
	await db.query('CREATE INDEX IF NOT EXISTS idx_birthdays_guild ON birthdays (guild_id)');
}

module.exports = createBirthdaysTable;
