const LevelService = require('../../services/LevelService');
const Reward = require('./Reward');

/**
 * Load all models: create tables, indexes, etc.
 * Called once at database initialization.
 */
async function loadModels(_pool) {
	// Create tables using injected repository if available, otherwise fallback to getPool()
	// Level table creation moved to standalone migration script (createLevelTable.js)
	// AFK table creation moved to standalone migration script (createAfkTable.js)
	await Reward.createTable();
	// Future models will register here:
	// Economy.createTable();
	// Settings.createTable();
}

module.exports = { loadModels, LevelService, Reward };
