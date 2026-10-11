'use strict';

let pool = null;

function init(p) {
	pool = p;
}

async function getAll() {
	try {
		const res = await pool.query('SELECT key, value FROM guild_config');
		return res.rows;
	}
	catch (error) {
		throw new Error(`Failed to get guild config: ${error.message}`, { cause: error });
	}
}

async function get(key) {
	try {
		const sql = 'SELECT value FROM guild_config WHERE key = $1';
		const res = await pool.query(sql, [key]);
		return res.rows[0]?.value || null;
	}
	catch (error) {
		throw new Error(`Failed to get guild config key ${key}: ${error.message}`, { cause: error });
	}
}

async function set(key, value) {
	try {
		const sql = `
			INSERT INTO guild_config (key, value)
			VALUES ($1, $2)
			ON CONFLICT (key) DO UPDATE SET value = $2
			RETURNING key, value`;
		const res = await pool.query(sql, [key, value]);
		return res.rows[0] || null;
	}
	catch (error) {
		throw new Error(`Failed to set guild config key ${key}: ${error.message}`, { cause: error });
	}
}

async function remove(key) {
	try {
		const sql = 'DELETE FROM guild_config WHERE key = $1 RETURNING key, value';
		const res = await pool.query(sql, [key]);
		return res.rows[0] || null;
	}
	catch (error) {
		throw new Error(`Failed to delete guild config key ${key}: ${error.message}`, { cause: error });
	}
}

module.exports = {
	init,
	getAll,
	get,
	set,
	remove,
};
