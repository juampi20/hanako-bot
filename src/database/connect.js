const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const instances = {};
let defaultPath = null;

function initialize(dbPath) {
  const resolved = path.resolve(dbPath);
  if (instances[resolved]) { return instances[resolved]; }
  if (!defaultPath) { defaultPath = resolved; }
  
  const dir = path.dirname(resolved);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const db = new DatabaseSync(resolved);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA synchronous = NORMAL');
  instances[resolved] = db;
  return db;
}

function close(dbPath) {
  const resolved = path.resolve(dbPath);
  if (instances[resolved]) {
    instances[resolved].close();
    delete instances[resolved];
  }
}

function getDb(dbPath) {
  const resolved = dbPath ? path.resolve(dbPath) : defaultPath;
  if (!resolved) {
    throw new Error('getDb() called before initialize() — no database path set');
  }
  if (!instances[resolved]) {
    throw new Error(`Database not initialized for path: ${resolved}`);
  }
  return instances[resolved];
}

module.exports = { initialize, close, getDb };
