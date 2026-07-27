/**
 * Load all models: create tables, indexes, etc.
 * Called once at database initialization.
 */
async function loadModels(_pool) {
	// All table creation moved to standalone migration scripts:
	// - createLevelTable.js (scores)
	// - createLevelRewardsTable.js (level_rewards)
	// - createAfkTable.js (afk)
	// Future models will register here:
	// Economy.createTable();
	// Settings.createTable();
}

module.exports = { loadModels };
