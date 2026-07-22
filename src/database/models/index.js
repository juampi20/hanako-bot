const Score = require('./Score');
const Reward = require('./Reward');
const Afk = require('./Afk');

/**
 * Load all models: create tables, indexes, etc.
 * Called once at database initialization.
 */
async function loadModels(pool) {
	await Score.createTable(pool);
	await Reward.createTable(pool);
	await Afk.createTable(pool);
	// Future models will register here:
	// Economy.createTable(pool);
	// Settings.createTable(pool);
}

module.exports = { loadModels, Score, Reward, Afk };
