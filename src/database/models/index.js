const { Score } = require('./Score');
const Reward = require('./Reward');
const Afk = require('./Afk');

/**
 * Load all models: create tables, indexes, etc.
 * Called once at database initialization.
 */
async function loadModels(_pool) {
	// Create tables using injected repository if available, otherwise fallback to getPool()
	await Score.createTable();
	await Reward.createTable();
	await Afk.createTable();
	// Future models will register here:
	// Economy.createTable();
	// Settings.createTable();
}

module.exports = { loadModels, Score, Reward, Afk };
