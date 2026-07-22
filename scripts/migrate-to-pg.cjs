#!/usr/bin/env node
'use strict';

const { DatabaseSync } = require('node:sqlite');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const SQLITE_PATH = path.resolve(__dirname, '..', 'data', 'scores.sqlite');
const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
	console.log('=== Migration: SQLite → PostgreSQL ===\n');

	// ── 1. Read SQLite data ──────────────────────────────────────
	if (!fs.existsSync(SQLITE_PATH)) {
		console.error(`✗ SQLite database not found: ${SQLITE_PATH}`);
		process.exit(1);
	}

	const sqliteDb = new DatabaseSync(SQLITE_PATH);
	const tables = ['scores', 'level_rewards', 'afk'];
	const data = {};

	for (const table of tables) {
		const rows = sqliteDb.prepare(`SELECT * FROM ${table}`).all();
		data[table] = rows;
		console.log(`  SQLite • ${table}: ${rows.length} rows`);
	}
	sqliteDb.close();

	// ── 2. Connect to PostgreSQL ─────────────────────────────────
	const DATABASE_URL = process.env.DATABASE_URL;

	if (!DATABASE_URL) {
		console.error('\n✗ DATABASE_URL not set. Provide it via environment variable.');
		console.error('  Example: DATABASE_URL=postgres://user:password@localhost:5432/hanako');
		process.exit(1);
	}

	if (DRY_RUN) {
		console.log('\n  DRY RUN — no changes made to PostgreSQL.');
		console.log(`  Would connect to: ${DATABASE_URL.replace(/\/\/.*@/, '//user:****@')}`);
		printSummary(data);
		process.exit(0);
	}

	const pool = new Pool({ connectionString: DATABASE_URL, max: 1 });

	try {
		// Test connection
		await pool.query('SELECT 1');
		console.log('\n  PostgreSQL: connected');

		// ── 3. Create tables ──────────────────────────────────────
		console.log('\n  Creating tables...');

		await pool.query(`
			CREATE TABLE IF NOT EXISTS scores (
				id TEXT PRIMARY KEY,
				"user" TEXT NOT NULL,
				guild TEXT NOT NULL,
				points INTEGER NOT NULL DEFAULT 0,
				level INTEGER NOT NULL DEFAULT 1
			)
		`);
		await pool.query('CREATE INDEX IF NOT EXISTS idx_scores_id ON scores (id)');
		console.log('    ✓ scores');

		await pool.query(`
			CREATE TABLE IF NOT EXISTS level_rewards (
				id SERIAL PRIMARY KEY,
				guild_id TEXT NOT NULL,
				level INTEGER NOT NULL,
				role_id TEXT NOT NULL,
				created_at TIMESTAMP DEFAULT NOW(),
				UNIQUE(guild_id, level)
			)
		`);
		console.log('    ✓ level_rewards');

		await pool.query(`
			CREATE TABLE IF NOT EXISTS afk (
				user_id TEXT NOT NULL,
				guild_id TEXT NOT NULL,
				reason TEXT NOT NULL DEFAULT 'Está ausente',
				started_at INTEGER NOT NULL,
				PRIMARY KEY (user_id, guild_id)
			)
		`);
		await pool.query('CREATE INDEX IF NOT EXISTS idx_afk_user_guild ON afk (user_id, guild_id)');
		console.log('    ✓ afk');

		// ── 4. Migrate data ───────────────────────────────────────
		console.log('\n  Migrating data...');
		let total = 0;

		// Scores
		for (const row of data.scores) {
			await pool.query(
				`INSERT INTO scores (id, "user", guild, points, level) VALUES ($1, $2, $3, $4, $5)
				 ON CONFLICT (id) DO UPDATE SET points = EXCLUDED.points, level = EXCLUDED.level`,
				[row.id, row.user, row.guild, row.points, row.level]
			);
			total++;
		}
		console.log(`    ✓ scores: ${data.scores.length} rows`);

		// Level rewards
		for (const row of data.level_rewards) {
			await pool.query(
				`INSERT INTO level_rewards (guild_id, level, role_id, created_at) VALUES ($1, $2, $3, $4)
				 ON CONFLICT (guild_id, level) DO UPDATE SET role_id = EXCLUDED.role_id`,
				[row.guild_id, row.level, row.role_id, row.created_at]
			);
			total++;
		}
		console.log(`    ✓ level_rewards: ${data.level_rewards.length} rows`);

		// Afk
		for (const row of data.afk) {
			await pool.query(
				`INSERT INTO afk (user_id, guild_id, reason, started_at) VALUES ($1, $2, $3, $4)
				 ON CONFLICT (user_id, guild_id) DO UPDATE SET reason = EXCLUDED.reason, started_at = EXCLUDED.started_at`,
				[row.user_id, row.guild_id, row.reason, row.started_at]
			);
			total++;
		}
		console.log(`    ✓ afk: ${data.afk.length} rows`);

		console.log(`\n  ✅ Migration complete! ${total} total rows migrated.`);
		printSummary(data);
	}
	catch (err) {
		console.error(`\n✗ Migration failed: ${err.message}`);
		process.exit(1);
	}
	finally {
		await pool.end();
	}
}

function printSummary(data) {
	const total = Object.values(data).reduce((sum, rows) => sum + rows.length, 0);
	console.log(`\n  Summary:`);
	console.log(`    scores        ${String(data.scores.length).padStart(4)} rows`);
	console.log(`    level_rewards ${String(data.level_rewards.length).padStart(4)} rows`);
	console.log(`    afk           ${String(data.afk.length).padStart(4)} rows`);
	console.log(`    ─────────────────`);
	console.log(`    Total         ${String(total).padStart(4)} rows`);
}

main().catch(err => {
	console.error(`✗ Fatal: ${err.message}`);
	process.exit(1);
});
