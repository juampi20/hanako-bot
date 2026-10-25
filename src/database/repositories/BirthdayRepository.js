'use strict';

/**
 * BirthdayRepository: function-style data + business logic for birthdays.
 */

let pool = null;

function init(p) {
	pool = p;
}

async function set(userId, date, timezone, ping) {
	try {
		const sql = `
			INSERT INTO birthdays (user_id, birthday, timezone, ping)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT (user_id) DO UPDATE SET birthday = $2, timezone = $3, ping = $4
			RETURNING *`;
		const res = await pool.query(sql, [userId, date, timezone, ping]);
		return res.rows[0] || null;
	}
	catch (error) {
		throw new Error(`Failed to set birthday for user ${userId}: ${error.message}`, { cause: error });
	}
}

async function get(userId) {
	try {
		const sql = 'SELECT * FROM birthdays WHERE user_id = $1';
		const res = await pool.query(sql, [userId]);
		return res.rows[0] || null;
	}
	catch (error) {
		throw new Error(`Failed to get birthday for user ${userId}: ${error.message}`, { cause: error });
	}
}

async function getAll() {
	try {
		const res = await pool.query('SELECT * FROM birthdays');
		return res.rows;
	}
	catch (error) {
		throw new Error(`Failed to get birthdays: ${error.message}`, { cause: error });
	}
}

async function remove(userId) {
	try {
		const sql = 'DELETE FROM birthdays WHERE user_id = $1 RETURNING *';
		const res = await pool.query(sql, [userId]);
		return res.rows[0] || null;
	}
	catch (error) {
		throw new Error(`Failed to remove birthday for user ${userId}: ${error.message}`, { cause: error });
	}
}

async function getByMonthDay(month, day) {
	try {
		const sql = `
			SELECT * FROM birthdays
			WHERE EXTRACT(MONTH FROM birthday) = $1
			  AND EXTRACT(DAY FROM birthday) = $2`;
		const res = await pool.query(sql, [month, day]);
		return res.rows;
	}
	catch (error) {
		throw new Error(`Failed to get birthdays for month ${month}, day ${day}: ${error.message}`, { cause: error });
	}
}

module.exports = {
	init,
	set,
	get,
	getAll,
	remove,
	getByMonthDay,
};
