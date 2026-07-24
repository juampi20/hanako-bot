const LevelService = require('../../services/LevelService');
const Reward = require('./Reward');
const Afk = require('./Afk');

/**
 * Load all models: create tables, indexes, etc.
 * Called once at database initialization.
 */
async function loadModels(_pool) {
	// Create tables using injected repository if available, otherwise fallback to getPool()
	// Level table creation moved to standalone migration script (createLevelTable.js)
	// Only services are exported - Reward and Afk kept for backward compatibility
	await Reward.createTable();
	await Afk.createTable();
	// Future models will register here:
	// Economy.createTable();
	// Settings.createTable();
}

module.exports = { loadModels, LevelService, Reward, Afk };
