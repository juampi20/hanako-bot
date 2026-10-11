'use strict';

/**
 * AfkRepository — Function-style data + business logic for AFK.
 */

let pool = null;

function init(p) {
	pool = p;
}

async function set(userId, reason, startedAt) {
	try {
		const sql = `
			INSERT INTO afk (user_id, reason, started_at)
			VALUES ($1, $2, $3)
			ON CONFLICT (user_id) DO UPDATE SET reason = $2, started_at = $3
			RETURNING *`;
		const res = await pool.query(sql, [userId, reason, startedAt]);
		return res.rows[0] || null;
	}
	catch (error) {
		throw new Error(`Failed to set AFK record for user ${userId}: ${error.message}`, { cause: error });
	}
}

async function remove(userId) {
	try {
		const sql = 'DELETE FROM afk WHERE user_id = $1 RETURNING *';
		const res = await pool.query(sql, [userId]);
		return res.rows[0] || null;
	}
	catch (error) {
		throw new Error(`Failed to remove AFK record for user ${userId}: ${error.message}`, { cause: error });
	}
}

async function isAfk(userId) {
	try {
		const sql = 'SELECT * FROM afk WHERE user_id = $1';
		const res = await pool.query(sql, [userId]);
		return res.rows[0] || null;
	}
	catch (error) {
		throw new Error(`Failed to check AFK status for user ${userId}: ${error.message}`, { cause: error });
	}
}

async function getAfkUsers() {
	try {
		const res = await pool.query('SELECT * FROM afk');
		return res.rows;
	}
	catch (error) {
		throw new Error(`Failed to get AFK users: ${error.message}`, { cause: error });
	}
}

async function removeAll() {
	try {
		const res = await pool.query('DELETE FROM afk RETURNING *');
		return res.rows;
	}
	catch (error) {
		throw new Error(`Failed to remove all AFK records: ${error.message}`, { cause: error });
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
