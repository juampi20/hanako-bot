'use strict';

const { getPool } = require('../connect');

async function createLevelTable() {
	const pool = getPool();
	try {
		console.log('Creating table scores if not exists...');
		await pool.query(`
			CREATE TABLE IF NOT EXISTS scores (
				id TEXT PRIMARY KEY,
				"user" TEXT NOT NULL,
				guild TEXT NOT NULL,
				points INTEGER NOT NULL DEFAULT 0,
				level INTEGER NOT NULL DEFAULT 1
			)
		`);
		console.log('Table scores created successfully');

		console.log('Creating unique index idx_scores_id if not exists...');
		await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_scores_id ON scores (id)');
		console.log('Index idx_scores_id created successfully');
	}
	catch (error) {
		console.error('Error creating table/index:', error);
		throw error;
	}
}

module.exports = createLevelTable;