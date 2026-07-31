'use strict';

/**
 * BirthdayRepository — Function-style data + business logic for birthdays.
 */

let pool = null;

function init(p) {
	pool = p;
}

async function set(userId, guildId, date) {
	try {
		const sql = `
			INSERT INTO birthdays (user_id, guild_id, birthday)
			VALUES ($1, $2, $3)
			ON CONFLICT (user_id) DO UPDATE SET guild_id = $2, birthday = $3
			RETURNING *`;
		const res = await pool.query(sql, [userId, guildId, date]);
		return res.rows[0] || null;
	}
	catch (error) {
		throw new Error(`Failed to set birthday for user ${userId}, guild ${guildId}: ${error.message}`, { cause: error });
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

async function getAll(guildId) {
	try {
		const sql = 'SELECT * FROM birthdays WHERE guild_id = $1';
		const res = await pool.query(sql, [guildId]);
		return res.rows;
	}
	catch (error) {
		throw new Error(`Failed to get birthdays for guild ${guildId}: ${error.message}`, { cause: error });
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
