#!/usr/bin/env node
'use strict';

const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const BACKUP_DIR = path.resolve(__dirname, '..', 'backups');
const TABLES = ['scores', 'level_rewards', 'afk'];

async function main() {
	const DATABASE_URL = process.env.DATABASE_URL;
	if (!DATABASE_URL) {
		console.error('DATABASE_URL not set.');
		process.exit(1);
	}

	const pool = new Pool({ connectionString: DATABASE_URL, max: 1 });

	try {
		fs.mkdirSync(BACKUP_DIR, { recursive: true });

		for (const table of TABLES) {
			const res = await pool.query(`SELECT * FROM ${table} ORDER BY 1`);
			const filePath = path.join(BACKUP_DIR, `${table}.json`);
			fs.writeFileSync(filePath, JSON.stringify(res.rows, null, 2));
			console.log(`Backed up ${table}: ${res.rows.length} rows → ${filePath}`);
		}

		// SQL dump
		let sqlDump = '';
		for (const table of TABLES) {
			const res = await pool.query(`SELECT * FROM ${table} ORDER BY 1`);
			const cols = res.fields.map(f => f.name);

			sqlDump += `-- Table: ${table}\n`;
			for (const row of res.rows) {
				const vals = cols.map(c => {
					const v = row[c];
					if (v === null) return 'NULL';
					if (typeof v === 'number') return String(v);
					return `'${String(v).replace(/'/g, "''")}'`;
				});
				sqlDump += `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${vals.join(', ')});\n`;
			}
			sqlDump += '\n';
		}

		fs.writeFileSync(path.join(BACKUP_DIR, 'full-dump.sql'), sqlDump);
		console.log(`SQL dump: ${path.join(BACKUP_DIR, 'full-dump.sql')}`);
		console.log('\nBackup complete.');
	}
	catch (err) {
		console.error(`Backup failed: ${err.message}`);
		process.exit(1);
	}
	finally {
		await pool.end();
	}
}

main().catch(err => {
	console.error(`Fatal: ${err.message}`);
	process.exit(1);
});
