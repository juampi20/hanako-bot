const Score = require('./Score');
const Reward = require('./Reward');
const Afk = require('./Afk');

/**
 * Load all models: create tables, indexes, etc.
 * Called once at database initialization.
 */
function loadModels(db) {
	Score.createTable(db);
	Reward.createTable(db);
	Afk.createTable(db);
	// Future models will register here:
	// Economy.createTable(db);
	// Settings.createTable(db);
}

module.exports = { loadModels, Score, Reward, Afk };
