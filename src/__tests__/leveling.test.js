const path = require('path');
const fs = require('fs');
const os = require('os');
const { initialize, getDb } = require('../services/database');
const LevelingService = require('../services/leveling');

const TEST_DB = path.join(os.tmpdir(), `hanako-test-${Date.now()}.sqlite`);

beforeAll(() => {
    initialize(TEST_DB);
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

describe('LevelingService', () => {
    let svc;

    beforeAll(() => {
        svc = new LevelingService();
    });

    describe('getScore', () => {
        test('returns default for new user', () => {
            const score = svc.getScore('newuser', 'guild1');
            expect(score).toEqual({
                id: 'guild1-newuser',
                user: 'newuser',
                guild: 'guild1',
                points: 0,
                level: 1,
            });
        });

        test('returns persisted score after addXP', () => {
            svc.addXP('persistuser', 'guild1', 50);
            const score = svc.getScore('persistuser', 'guild1');
            expect(score.points).toBe(50);
        });
    });

    describe('addXP', () => {
        test('adds XP and recalculates level', () => {
            const result = svc.addXP('xptest', 'guild1', 100);
            expect(result.points).toBe(100);
            expect(result.level).toBe(Math.floor(0.1 * Math.sqrt(100)));
        });

        test('returns null for zero XP', () => {
            expect(svc.addXP('zerotest', 'guild1', 0)).toBeNull();
        });

        test('returns null for negative XP', () => {
            expect(svc.addXP('negtest', 'guild1', -10)).toBeNull();
        });
    });

    describe('getLeaderboard', () => {
        test('returns top scores ordered by points DESC', () => {
            svc.addXP('lbtop', 'guild2', 200);
            svc.addXP('lbbottom', 'guild2', 50);

            const lb = svc.getLeaderboard('guild2');
            expect(lb.length).toBeGreaterThanOrEqual(2);
            expect(lb[0].user).toBe('lbtop');
            expect(lb[0].points).toBeGreaterThanOrEqual(lb[1].points);
        });

        test('returns empty array for guild with no scores', () => {
            const lb = svc.getLeaderboard('emptyguild');
            expect(lb).toEqual([]);
        });
    });

    describe('givePoints', () => {
        test('transfers points between users', () => {
            svc.addXP('giver', 'guild3', 100);
            svc.addXP('receiver', 'guild3', 10);

            const result = svc.givePoints('giver', 'receiver', 'guild3', 30);
            expect(result).not.toBeNull();
            expect(result.sender.points).toBe(70);
            expect(result.target.points).toBe(40);
        });

        test('returns null for insufficient points', () => {
            const result = svc.givePoints('pooruser', 'richuser', 'guild3', 999);
            expect(result).toBeNull();
        });
    });
});
