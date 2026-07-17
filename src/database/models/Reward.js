function getDb() {
  return require("../connect").getDb();
}

class Reward {
  static createTable(db) {
    db.exec(
      "CREATE TABLE IF NOT EXISTS level_rewards (" +
        "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
        "guild_id TEXT NOT NULL, " +
        "level INTEGER NOT NULL, " +
        "role_id TEXT NOT NULL, " +
        "created_at TEXT DEFAULT (datetime('now')), " +
        "UNIQUE(guild_id, level)" +
        ")"
    );
  }

  static create(guildId, level, roleId) {
    const db = getDb();
    try {
      const result = db
        .prepare(
          "INSERT INTO level_rewards (guild_id, level, role_id) VALUES (?, ?, ?)"
        )
        .run(guildId, level, roleId);
      return {
        id: result.lastInsertRowid,
        guild_id: guildId,
        level: level,
        role_id: roleId,
        created_at: new Date().toISOString().slice(0, 19).replace("T", " "),
      };
    } catch (err) {
      if (err.errcode === 2067 || err.message.includes("UNIQUE constraint failed")) {
        return null;
      }
      throw err;
    }
  }

  static findByGuildAndLevel(guildId, level) {
    const db = getDb();
    const row = db
      .prepare("SELECT * FROM level_rewards WHERE guild_id = ? AND level = ?")
      .get(guildId, level);
    if (row) {
      return {
        id: row.id,
        guild_id: row.guild_id,
        level: row.level,
        role_id: row.role_id,
        created_at: row.created_at,
      };
    }
    return undefined;
  }

  static findById(id) {
    const db = getDb();
    const row = db
      .prepare("SELECT * FROM level_rewards WHERE id = ?")
      .get(id);
    if (row) {
      return {
        id: row.id,
        guild_id: row.guild_id,
        level: row.level,
        role_id: row.role_id,
        created_at: row.created_at,
      };
    }
    return undefined;
  }

  static findAllByGuild(guildId) {
    const db = getDb();
    const rows = db
      .prepare(
        "SELECT * FROM level_rewards WHERE guild_id = ? ORDER BY level"
      )
      .all(guildId);
    return rows.map(function (row) {
      return {
        id: row.id,
        guild_id: row.guild_id,
        level: row.level,
        role_id: row.role_id,
        created_at: row.created_at,
      };
    });
  }

  static deleteById(id) {
    const db = getDb();
    const result = db
      .prepare("DELETE FROM level_rewards WHERE id = ?")
      .run(id);
    return { changes: result.changes };
  }

  static verifyGuildOwnership(id, guildId) {
    const reward = Reward.findById(id);
    return reward && reward.guild_id === guildId;
  }
}

module.exports = Reward;
