/**
 * Lazily resolve getDb to avoid circular dependency:
 * connect.js → models/index.js → Score.js → connect.js
 */
function getDb() {
    return require('../connect').getDb();
}

/**
 * Formula: XP needed for level N
 *   xp = 330(N-1)^2 + 300(N-1)
 *
 * Inverted to get level from XP:
 *   k = floor((-300 + sqrt(90000 + 1320*xp)) / 660)
 *   level = max(k + 1, 1)
 */
function getLevelFromXP(xp) {
    if (xp <= 0) {return 1;}
    const k = Math.floor((-300 + Math.sqrt(90000 + 1320 * xp)) / 660);
    return Math.max(k + 1, 1);
}

function getXPForLevel(level) {
    const n = Math.max(level - 1, 0);
    return 330 * n * n + 300 * n;
}

class Score {
    /**
     * Create the scores table and indexes.
     * Called once at startup.
     */
    static createTable(db) {
        db.exec(`
            CREATE TABLE IF NOT EXISTS scores (
                id TEXT PRIMARY KEY,
                user TEXT NOT NULL,
                guild TEXT NOT NULL,
                points INTEGER NOT NULL DEFAULT 0,
                level INTEGER NOT NULL DEFAULT 1
            )
        `);
        db.exec(
            "CREATE UNIQUE INDEX IF NOT EXISTS idx_scores_id ON scores (id)"
        );
    }

    /**
     * Find a score by user + guild.
     * Returns a plain object or null.
     */
    static findByUser(userId, guildId) {
        const db = getDb();
        const row = db
            .prepare("SELECT * FROM scores WHERE user = ? AND guild = ?")
            .get(userId, guildId);

        if (row) {
            return {
                id: row.id,
                user: row.user,
                guild: row.guild,
                points: row.points,
                level: getLevelFromXP(row.points),  // recalculate from points
            };
        }
        return {
            id: `${guildId}-${userId}`,
            user: userId,
            guild: guildId,
            points: 0,
            level: 1,
        };
    }

    /**
     * Upsert a score row.
     */
    static upsert(data) {
        const db = getDb();
        db.prepare(
            `INSERT OR REPLACE INTO scores (id, user, guild, points, level)
             VALUES (@id, @user, @guild, @points, @level)`
        ).run({
            id: data.id,
            user: data.user,
            guild: data.guild,
            points: data.points,
            level: data.level,
        });
    }

    /**
     * Get the top N scores for a guild.
     */
    static getLeaderboard(guildId, limit = 10) {
        const db = getDb();
        const rows = db
            .prepare(
                "SELECT * FROM scores WHERE guild = ? ORDER BY points DESC LIMIT ?"
            )
            .all(guildId, limit);

        return rows.map((row) => ({
            id: row.id,
            user: row.user,
            guild: row.guild,
            points: row.points,
            level: getLevelFromXP(row.points),  // recalculate from points
        }));
    }

    /**
     * Add XP to a user's score and recalculate level.
     * Returns the updated score object with oldLevel, or null if amount is invalid.
     */
    static addXP(userId, guildId, amount) {
        if (!amount || amount <= 0) {
            return null;
        }

        const current = Score.findByUser(userId, guildId);
        const newPoints = current.points + amount;
        const newLevel = getLevelFromXP(newPoints);
        const oldLevel = current.level;

        Score.upsert({
            id: current.id,
            user: current.user,
            guild: current.guild,
            points: newPoints,
            level: newLevel,
        });

        return {
            id: current.id,
            user: current.user,
            guild: current.guild,
            points: newPoints,
            level: newLevel,
            oldLevel,
        };
    }

    // ── Compatibility aliases ────────────────────────────
    // These match the method names used by existing commands.

    /** Alias for findByUser — used by rank command */
    static getScore(userId, guildId) {
        return Score.findByUser(userId, guildId);
    }

    /** Expose formula — used by rank command */
    static getXPForLevel(level) {
        return getXPForLevel(level);
    }

    /** Expose inverse formula — used internally and by tests */
    static getLevelFromXP(xp) {
        return getLevelFromXP(xp);
    }

    /** Set XP directly, recalculate level. Can go up or down. */
    static setXP(userId, guildId, xp) {
        if (xp < 0) {return null;}
        const current = Score.findByUser(userId, guildId);
        const oldLevel = current.level;
        const newLevel = getLevelFromXP(xp);

        Score.upsert({
            id: current.id,
            user: current.user,
            guild: current.guild,
            points: xp,
            level: newLevel,
        });

        return { points: xp, level: newLevel, oldLevel };
    }

    /** Set level directly, compute minimum XP for that level. */
    static setLevel(userId, guildId, level) {
        if (level < 1) {return null;}
        const minXP = getXPForLevel(level);
        const current = Score.findByUser(userId, guildId);
        const oldLevel = current.level;

        Score.upsert({
            id: current.id,
            user: current.user,
            guild: current.guild,
            points: minXP,
            level: level,
        });

        return { points: minXP, level, oldLevel };
    }
}

module.exports = Score;
