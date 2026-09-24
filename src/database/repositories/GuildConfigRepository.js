'use strict';

let pool = null;

function init(p) {
	pool = p;
}

async function getAll(guildId) {
	try {
		const sql = `
			SELECT key, value FROM guild_config WHERE guild_id = $1
		`;
		const res = await pool.query(sql, [guildId]);
		return res.rows;
	}
	catch (error) {
		throw new Error(`Failed to get guild config for guild ${guildId}: ${error.message}`, { cause: error });
	}
}

async function get(guildId, key) {
	try {
		const sql = 'SELECT value FROM guild_config WHERE guild_id = $1 AND key = $2';
		const res = await pool.query(sql, [guildId, key]);
		return res.rows[0]?.value || null;
	}
	catch (error) {
		throw new Error(`Failed to get guild config key ${key} for guild ${guildId}: ${error.message}`, { cause: error });
	}
}

async function set(guildId, key, value) {
	try {
		const sql = `
			INSERT INTO guild_config (guild_id, key, value)
			VALUES ($1, $2, $3)
			ON CONFLICT (guild_id, key) DO UPDATE SET value = $3
			RETURNING guild_id, key, value`;
		const res = await pool.query(sql, [guildId, key, value]);
		return res.rows[0] || null;
	}
	catch (error) {
		throw new Error(`Failed to set guild config key ${key} for guild ${guildId}: ${error.message}`, { cause: error });
	}
}

async function remove(guildId, key) {
	try {
		const sql = 'DELETE FROM guild_config WHERE guild_id = $1 AND key = $2 RETURNING guild_id, key, value';
		const res = await pool.query(sql, [guildId, key]);
		return res.rows[0] || null;
	}
	catch (error) {
		throw new Error(`Failed to delete guild config key ${key} for guild ${guildId}: ${error.message}`, { cause: error });
	}
}

module.exports = {
	init,
	getAll,
	get,
	set,
	remove,
};