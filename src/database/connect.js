const { Pool } = require('pg');

let pool = null;

async function initialize() {
	const connectionString = process.env.DATABASE_URL ||
        `postgres://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`;

	pool = new Pool({ connectionString, max: 5, min: 1 });
	pool.on('error', err => {
		console.error('Database pool error:', err);
	});

	const MAX_RETRIES = 4;
	const RETRY_DELAYS = [1000, 2000, 4000, 8000];

	for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
		try {
			await pool.query('SELECT 1');
			return pool;
		}
		catch (err) {
			console.error(`Database connection attempt ${attempt}/${MAX_RETRIES} failed:`, err.message);
			if (attempt === MAX_RETRIES) {
				throw new Error(`Database connection failed after ${MAX_RETRIES} attempts. Last error: ${err.message}`, { cause: err });
			}
			await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS[attempt - 1]));
		}
	}
}

function getPool() {
	if (!pool) throw new Error('Database not initialized');
	return pool;
}

async function close() {
	if (pool) {
		await pool.end();
		pool = null;
	}
}

module.exports = { initialize, getPool, close };
