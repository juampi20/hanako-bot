'use strict';

/**
 * AfkRepository — Function-style data + business logic for AFK.
 */

let pool = null;

function init(p) {
	pool = p;
}

async function set(userId, guildId, reason, startedAt) {
	try {
		const sql = `
			INSERT INTO afk (user_id, guild_id, reason, started_at)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT (user_id, guild_id) DO UPDATE SET reason = $3, started_at = $4
			RETURNING *`;
		const res = await pool.query(sql, [userId, guildId, reason, startedAt]);
		return res.rows[0] || null;
	}
	catch (error) {
		throw new Error(`Failed to set AFK record for user ${userId}, guild ${guildId}: ${error.message}`, { cause: error });
	}
}

async function remove(userId, guildId) {
	try {
		const sql = 'DELETE FROM afk WHERE user_id = $1 AND guild_id = $2 RETURNING *';
		const res = await pool.query(sql, [userId, guildId]);
		return res.rows[0] || null;
	}
	catch (error) {
		throw new Error(`Failed to remove AFK record for user ${userId}, guild ${guildId}: ${error.message}`, { cause: error });
	}
}

async function isAfk(userId, guildId) {
	try {
		const sql = 'SELECT * FROM afk WHERE user_id = $1 AND guild_id = $2';
		const res = await pool.query(sql, [userId, guildId]);
		return res.rows[0] || null;
	}
	catch (error) {
		throw new Error(`Failed to check AFK status for user ${userId}, guild ${guildId}: ${error.message}`, { cause: error });
	}
}

async function getAfkUsers(guildId) {
	try {
		const sql = 'SELECT * FROM afk WHERE guild_id = $1';
		const res = await pool.query(sql, [guildId]);
		return res.rows;
	}
	catch (error) {
		throw new Error(`Failed to get AFK users for guild ${guildId}: ${error.message}`, { cause: error });
	}
}

async function removeAll(guildId) {
	try {
		const sql = 'DELETE FROM afk WHERE guild_id = $1 RETURNING *';
		const res = await pool.query(sql, [guildId]);
		return res.rows;
	}
	catch (error) {
		throw new Error(`Failed to remove all AFK records for guild ${guildId}: ${error.message}`, { cause: error });
	}
}

module.exports = {
	init,
	set,
	remove,
	isAfk,
	getAfkUsers,
	removeAll,
};
