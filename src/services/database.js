const { DatabaseSync } = require('node:sqlite');

let dbInstance = null;

function initialize(path) {
    if (dbInstance !== null) {
        return dbInstance;
    }
    
    dbInstance = new DatabaseSync(path);
    
    dbInstance.exec("PRAGMA journal_mode = wal");
    dbInstance.exec("PRAGMA synchronous = 1");
    
    const createTableSQL = [
        "CREATE TABLE IF NOT EXISTS scores (",
        "    id TEXT PRIMARY KEY,",
        "    user TEXT,",
        "    guild TEXT,",
        "    points INTEGER,",
        "    level INTEGER",
        ");"
    ].join('\n');
    
    dbInstance.prepare(createTableSQL).run();
    
    const createIndexSQL = "CREATE UNIQUE INDEX IF NOT EXISTS idx_scores_id ON scores (id);";
    dbInstance.prepare(createIndexSQL).run();
    
    return dbInstance;
}

function getDb() {
    if (dbInstance === null) {
        throw new Error("Database not initialized. Call initialize(path) first.");
    }
    return dbInstance;
}

module.exports = {
    initialize,
    getDb
};