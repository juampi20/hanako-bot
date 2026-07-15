const { getDb } = require('./database');

/**
 * Mee6-style formula: XP needed for level N
 *   xp = 5(N-1)^2 + 50(N-1) + 100
 *
 * Inverted to get level from XP:
 *   k = floor((-50 + sqrt(500 + 20*xp)) / 10)
 *   level = max(k + 1, 1)
 */
function getLevelFromXP(xp) {
    const k = Math.floor((-50 + Math.sqrt(500 + 20 * xp)) / 10);
    return Math.max(k + 1, 1);
}

function getXPForLevel(level) {
    const n = Math.max(level - 1, 0);
    return 5 * n * n + 50 * n + 100;
}

class LevelingService {
    constructor() {
        const db = getDb();
        this.db = db;
        this.getScoreStmt = db.prepare(
            'SELECT * FROM scores WHERE user = ? AND guild = ?'
        );
        this.upsertScoreStmt = db.prepare(
            'INSERT OR REPLACE INTO scores (id, user, guild, points, level) VALUES (@id, @user, @guild, @points, @level)'
        );
        this.getLeaderboardStmt = db.prepare(
            'SELECT * FROM scores WHERE guild = ? ORDER BY points DESC LIMIT ?'
        );
    }

    getScore(userId, guildId) {
        const result = this.getScoreStmt.get(userId, guildId);
        if (result) {
            return {
                id: result.id,
                user: result.user,
                guild: result.guild,
                points: result.points,
                level: result.level
            };
        }
        return {
            id: `${guildId}-${userId}`,
            user: userId,
            guild: guildId,
            points: 0,
            level: 1
        };
    }

    addXP(userId, guildId, amount) {
        if (!amount || amount <= 0) {
            return null;
        }
        
        const current = this.getScore(userId, guildId);
        const newPoints = current.points + amount;
        const newLevel = getLevelFromXP(newPoints);
        const oldLevel = current.level;

        this.upsertScoreStmt.run({
            id: current.id,
            user: current.user,
            guild: current.guild,
            points: newPoints,
            level: newLevel
        });
        
        return { id: current.id, user: current.user, guild: current.guild, points: newPoints, level: newLevel, oldLevel };
    }

    getLeaderboard(guildId, limit = 10) {
        const results = this.getLeaderboardStmt.all(guildId, limit);
        return results.map(row => ({
            id: row.id,
            user: row.user,
            guild: row.guild,
            points: row.points,
            level: row.level
        }));
    }

    givePoints(senderId, targetId, guildId, amount) {
        if (!amount || amount <= 0) {
            return null;
        }
        
        const senderScore = this.getScore(senderId, guildId);
        if (!senderScore || senderScore.points < amount) {
            return null;
        }
        
        this.db.exec('BEGIN');
        try {
            const senderPoints = senderScore.points - amount;
            const senderLevel = getLevelFromXP(senderPoints);
            const senderOldLevel = senderScore.level;

            this.upsertScoreStmt.run({
                id: senderScore.id,
                user: senderScore.user,
                guild: senderScore.guild,
                points: senderPoints,
                level: senderLevel
            });
            
            const targetScore = this.getScore(targetId, guildId);
            const targetPoints = targetScore.points + amount;
            const targetLevel = getLevelFromXP(targetPoints);
            const targetOldLevel = targetScore.level;

            this.upsertScoreStmt.run({
                id: targetScore.id,
                user: targetScore.user,
                guild: targetScore.guild,
                points: targetPoints,
                level: targetLevel
            });
            
            this.db.exec('COMMIT');
            return {
                sender: { id: senderScore.id, user: senderScore.user, guild: senderScore.guild, points: senderPoints, level: senderLevel, oldLevel: senderOldLevel },
                target: { id: targetScore.id, user: targetScore.user, guild: targetScore.guild, points: targetPoints, level: targetLevel, oldLevel: targetOldLevel }
            };
        } catch (err) {
            this.db.exec('ROLLBACK');
            throw err;
        }
    }

    static getLevelFromXP(xp) {
        return getLevelFromXP(xp);
    }

    static getXPForLevel(level) {
        return getXPForLevel(level);
    }
}

module.exports = LevelingService;