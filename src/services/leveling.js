const { getDb } = require('./database');

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
        const newLevel = Math.floor(0.1 * Math.sqrt(newPoints));
        
        const updated = {
            ...current,
            points: newPoints,
            level: newLevel
        };
        
        this.upsertScoreStmt.run(updated);
        return updated;
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
            const senderUpdated = {
                ...senderScore,
                points: senderScore.points - amount,
                level: Math.floor(0.1 * Math.sqrt(senderScore.points - amount))
            };
            this.upsertScoreStmt.run(senderUpdated);
            
            const targetScore = this.getScore(targetId, guildId);
            const targetUpdated = {
                ...targetScore,
                points: targetScore.points + amount,
                level: Math.floor(0.1 * Math.sqrt(targetScore.points + amount))
            };
            this.upsertScoreStmt.run(targetUpdated);
            
            this.db.exec('COMMIT');
            return {
                sender: senderUpdated,
                target: targetUpdated
            };
        } catch (err) {
            this.db.exec('ROLLBACK');
            throw err;
        }
    }
}

module.exports = LevelingService;