#!/usr/bin/env node
'use strict';

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.resolve(__dirname, '..', 'data', 'scores.sqlite');
const BACKUP_DIR = path.resolve(__dirname, '..', 'backups');

if (!fs.existsSync(DB_PATH)) {
	console.error(`Database not found at ${DB_PATH}`);
	process.exit(1);
}

fs.mkdirSync(BACKUP_DIR, { recursive: true });

const db = new DatabaseSync(DB_PATH);

const tables = ['scores', 'level_rewards', 'afk'];

for (const table of tables) {
	const rows = db.prepare(`SELECT * FROM ${table}`).all();
	const filePath = path.join(BACKUP_DIR, `${table}.json`);
	fs.writeFileSync(filePath, JSON.stringify(rows, null, 2));
	console.log(`Backed up ${table}: ${rows.length} rows → ${filePath}`);
}

// Full SQL dump
let sqlDump = '';
for (const table of tables) {
	const createSql = db
		.prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name=?`)
		.get(table);
	if (createSql) {
		sqlDump += `-- Table: ${table}\n${createSql.sql};\n\n`;
	}

	const rows = db.prepare(`SELECT * FROM ${table}`).all();
	for (const row of rows) {
		const cols = Object.keys(row);
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

db.close();
console.log('\nBackup complete.');
