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
			PRIMARY KEY (user_id)
		);
	`);
	await db.query('CREATE INDEX IF NOT EXISTS idx_birthdays_guild ON birthdays (guild_id)');
}

module.exports = createBirthdaysTable;
