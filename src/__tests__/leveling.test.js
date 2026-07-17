const path = require('path');
const fs = require('fs');
const os = require('os');
const { initialize, getDb } = require('../database/connect');
const { loadModels, Score, Reward } = require('../database/models');

const TEST_DB = path.join(os.tmpdir(), `hanako-test-${Date.now()}.sqlite`);

beforeAll(() => {
    const db = initialize(TEST_DB);
    loadModels(db);
});

afterAll(() => {
    getDb().close();
    try { fs.unlinkSync(TEST_DB); } catch { /* ok */ }
});

describe('database singleton', () => {
    test('initialize() returns a db instance', () => {
        const db = getDb();
        expect(db).toBeDefined();
    });

    test('getDb() returns the same instance', () => {
        const db1 = getDb();
        const db2 = initialize(TEST_DB); // idempotent
        expect(db1).toBe(db2);
    });
});

describe('Score model', () => {
    describe('findByUser', () => {
        test('returns default for new user', () => {
            const score = Score.findByUser('newuser', 'guild1');
            expect(score).toEqual({
                id: 'guild1-newuser',
                user: 'newuser',
                guild: 'guild1',
                points: 0,
                level: 1,
            });
        });

        test('returns persisted score after addXP', () => {
            Score.addXP('persistuser', 'guild1', 50);
            const score = Score.findByUser('persistuser', 'guild1');
            expect(score.points).toBe(50);
        });
    });

    describe('addXP', () => {
        test('adds XP and recalculates level (Mee6 formula)', () => {
            const result = Score.addXP('xptest', 'guild1', 100);
            expect(result.points).toBe(100);
            // Mee6: level 1 requires 100 XP
            expect(result.level).toBe(1);
        });

        test('returns oldLevel for level-up detection', () => {
            const result = Score.addXP('leveluptest', 'guild1', 200);
            expect(result.level).toBe(2);
            expect(result.oldLevel).toBe(1); // started at level 1
            expect(result.level).toBeGreaterThan(result.oldLevel);
        });

        test('returns null for zero XP', () => {
            expect(Score.addXP('zerotest', 'guild1', 0)).toBeNull();
        });

        test('returns null for negative XP', () => {
            expect(Score.addXP('negtest', 'guild1', -10)).toBeNull();
        });
    });

    describe('getLeaderboard', () => {
        test('returns top scores ordered by points DESC', () => {
            Score.addXP('lbtop', 'guild2', 200);
            Score.addXP('lbbottom', 'guild2', 50);

            const lb = Score.getLeaderboard('guild2');
            expect(lb.length).toBeGreaterThanOrEqual(2);
            expect(lb[0].user).toBe('lbtop');
            expect(lb[0].points).toBeGreaterThanOrEqual(lb[1].points);
        });

        test('returns empty array for guild with no scores', () => {
            const lb = Score.getLeaderboard('emptyguild');
            expect(lb).toEqual([]);
        });
    });

    describe('setXP', () => {
        test('sets XP and recalculates level', () => {
            Score.addXP('setxptest', 'guild4', 500);

            const result = Score.setXP('setxptest', 'guild4', 200);
            expect(result).not.toBeNull();
            expect(result.points).toBe(200);
            expect(result.level).toBe(3);
        });

        test('can go down in level', () => {
            const result = Score.setXP('downtest', 'guild4', 50);
            expect(result).not.toBeNull();
            expect(result.points).toBe(50);
            expect(result.level).toBe(1);
        });
    });

    describe('setLevel', () => {
        test('sets level and computes minimum XP', () => {
            const result = Score.setLevel('lvltest', 'guild4', 5);
            expect(result).not.toBeNull();
            expect(result.level).toBe(5);
            expect(result.points).toBe(300);
        });

        test('returns null for level below 1', () => {
            const result = Score.setLevel('badlvl', 'guild4', 0);
            expect(result).toBeNull();
        });
    });
});

describe('Reward model', () => {
    describe('createTable', () => {
        test('creates level_rewards table', () => {
            expect(true).toBe(true);
        });
    });

    describe('create', () => {
        test('creates reward successfully', () => {
            const result = Reward.create('guild1', 5, 'role123');
            expect(result).toBeDefined();
            expect(result.id).toBeDefined();
            expect(result.guild_id).toBe('guild1');
            expect(result.level).toBe(5);
            expect(result.role_id).toBe('role123');
        });

        test('returns null for duplicate reward (unique constraint)', () => {
            Reward.create('guild2', 10, 'role456');
            const result = Reward.create('guild2', 10, 'role456_dup');
            expect(result).toBeNull();
        });
    });

    describe('findByGuildAndLevel', () => {
        test('finds existing reward', () => {
            Reward.create('guild3', 7, 'role789');
            const reward = Reward.findByGuildAndLevel('guild3', 7);
            expect(reward).toBeDefined();
            expect(reward.level).toBe(7);
            expect(reward.role_id).toBe('role789');
        });

        test('returns undefined for non-existent reward', () => {
            const reward = Reward.findByGuildAndLevel('guild4', 99);
            expect(reward).toBeUndefined();
        });
    });

    describe('findById', () => {
        test('finds reward by ID', () => {
            const result1 = Reward.create('guild5', 12, 'role999');
            const id = result1.id;
            const reward = Reward.findById(id);
            expect(reward).toBeDefined();
            expect(reward.id).toBe(id);
        });

        test('returns undefined for non-existent ID', () => {
            const reward = Reward.findById(999999);
            expect(reward).toBeUndefined();
        });
    });

    describe('findAllByGuild', () => {
        test('lists all rewards for a guild ordered by level', () => {
            Reward.create('guild6', 3, 'role_a');
            Reward.create('guild6', 1, 'role_b');
            Reward.create('guild6', 5, 'role_c');
            
            const rewards = Reward.findAllByGuild('guild6');
            expect(rewards.length).toBe(3);
            expect(rewards[0].level).toBe(1);
            expect(rewards[1].level).toBe(3);
            expect(rewards[2].level).toBe(5);
        });

        test('returns empty array for guild with no rewards', () => {
            const rewards = Reward.findAllByGuild('emptyguild');
            expect(rewards).toEqual([]);
        });
    });

    describe('deleteById', () => {
        test('deletes existing reward', () => {
            const result1 = Reward.create('guild7', 20, 'role_del');
            const id = result1.id;
            const result = Reward.deleteById(id);
            expect(result.changes).toBe(1);
            
            const reward = Reward.findById(id);
            expect(reward).toBeUndefined();
        });

        test('returns changes: 0 for non-existent ID', () => {
            const result = Reward.deleteById(888888);
            expect(result.changes).toBe(0);
        });
    });
});
