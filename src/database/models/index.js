const LevelService = require('../../services/LevelService');
const Afk = require('./Afk');

/**
 * Load all models: create tables, indexes, etc.
 * Called once at database initialization.
 */
async function loadModels(_pool) {
	// Rewards table creation moved to standalone migration script (createLevelRewardsTable.js)
	await Afk.createTable();
	// Future models will register here:
	// Economy.createTable();
	// Settings.createTable();
}

module.exports = { loadModels, LevelService, Afk };
