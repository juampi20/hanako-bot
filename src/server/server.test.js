'use strict';

const request = require('supertest');

jest.mock('../database/repositories/LevelRepository', () => ({
	getXPForLevel: jest.fn(level => {
		// Formula used by the real repo: 330*(n-1)^2 + 300*(n-1)
		const n = Math.max(level - 1, 0);
		return 330 * n * n + 300 * n;
	}),
	findByUser: jest.fn(),
	getLeaderboard: jest.fn(),
	getLeaderboardCount: jest.fn(),
	setXP: jest.fn(),
	setLevel: jest.fn(),
	findAllRewardsByGuild: jest.fn(),
	findRewardById: jest.fn(),
	createReward: jest.fn(),
	deleteReward: jest.fn(),
	verifyRewardOwnership: jest.fn(),
}));

jest.mock('../database/repositories/AfkRepository', () => ({
	isAfk: jest.fn(),
	set: jest.fn(),
	remove: jest.fn(),
	removeAll: jest.fn(),
	getAfkUsers: jest.fn(),
}));

const LevelRepository = require('../database/repositories/LevelRepository');
const AfkRepository = require('../database/repositories/AfkRepository');

const config = { guildId: 'guild-1', apiKey: 'test-key' };

beforeEach(() => {
	jest.clearAllMocks();
});

// ── Helpers ────────────────────────────────────────────────

function createTestApp() {
	return require('./server').createApp(config);
}

// ── AppError ────────────────────────────────────────────────

const AppError = require('./errors/AppError');

describe('AppError', () => {
	it('should create an operational error with status code', () => {
		const err = new AppError('Test error', 400);

		expect(err).toBeInstanceOf(Error);
		expect(err).toBeInstanceOf(AppError);
		expect(err.message).toBe('Test error');
		expect(err.statusCode).toBe(400);
		expect(err.isOperational).toBe(true);
		expect(err.status).toBe('fail');
	});

	it('should create an operational error for server error', () => {
		const err = new AppError('Server error', 500);

		expect(err.status).toBe('error');
	});
});

// ── notFound middleware tests ──────────────────────────────

const notFound = require('./middleware/notFound');

describe('notFound middleware', () => {
	test('returns 404 JSON for unmatched route', () => {
		const req = {};
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};

		notFound(req, res);

		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({ success: false, error: { message: 'Route not found' } });
	});
});

// ── errorHandler middleware tests ──────────────────────────

const errorHandler = require('./middleware/errorHandler');
const AppErrorTest = require('./errors/AppError');

describe('errorHandler middleware', () => {
	test('handles AppError operational errors', () => {
		const err = new AppErrorTest('Not found', 404);
		const req = {};
		const res = {
			status: jest.fn().mockReturnThis(),
			json: jest.fn(),
		};
		const next = jest.fn();

		errorHandler(err, req, res, next);

		expect(res.status).toHaveBeenCalledWith(404);
		expect(res.json).toHaveBeenCalledWith({ success: false, error: { message: 'Not found' } });
	});
});

// ── Health ─────────────────────────────────────────────────

describe('GET /api/health', () => {
	const app = createTestApp();

	test('returns 200 without auth', async () => {
		const res = await request(app).get('/api/health');
		expect(res.status).toBe(200);
		expect(res.body).toEqual({ status: 'ok' });
	});
});

// ── Auth ───────────────────────────────────────────────────

describe('Auth protection', () => {
	const app = createTestApp();

	test('returns 401 without API key', async () => {
		const res = await request(app).get('/api/levels/rank/123');
		expect(res.status).toBe(401);
	});
});

// ── Levels ─────────────────────────────────────────────────

describe('GET /api/levels/rank/:userId', () => {
	const app = createTestApp();

	test('returns rank data', async () => {
		LevelRepository.findByUser.mockResolvedValue({
			points: 500, level: 5,
		});
		LevelRepository.getLeaderboard.mockResolvedValue([
			{ user: '1', points: 1000 },
			{ user: '123', points: 500 },
			{ user: '3', points: 100 },
		]);

		const res = await request(app)
			.get('/api/levels/rank/123')
			.set('X-API-Key', 'test-key');

		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.data.rank).toBe(2);
	});

	test('returns 404 when user not found (0 points)', async () => {
		LevelRepository.findByUser.mockResolvedValue({
			points: 0, level: 1,
		});

		const res = await request(app)
			.get('/api/levels/rank/999')
			.set('X-API-Key', 'test-key');

		expect(res.status).toBe(404);
		expect(res.body.success).toBe(false);
	});
});

describe('GET /api/levels/leaderboard', () => {
	const app = createTestApp();

	test('returns paginated leaderboard', async () => {
		LevelRepository.getLeaderboard.mockResolvedValue([
			{ user: '1', points: 1000, level: 10 },
		]);

		const res = await request(app)
			.get('/api/levels/leaderboard')
			.set('X-API-Key', 'test-key');

		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(Array.isArray(res.body.data)).toBe(true);
		expect(res.body.meta).toBeDefined();
	});
});

describe('PUT /api/levels/xp', () => {
	const app = createTestApp();

	test('sets XP and returns result', async () => {
		LevelRepository.setXP.mockResolvedValue({
			points: 500, level: 5, oldLevel: 4,
		});

		const res = await request(app)
			.put('/api/levels/xp')
			.set('X-API-Key', 'test-key')
			.send({ userId: '123', xp: 500 });

		expect(res.status).toBe(200);
	});

	test('returns 400 for negative XP', async () => {
		const res = await request(app)
			.put('/api/levels/xp')
			.set('X-API-Key', 'test-key')
			.send({ userId: '123', xp: -10 });

		expect(res.status).toBe(400);
	});
});

// ── Rewards ────────────────────────────────────────────────

describe('GET /api/rewards', () => {
	const app = createTestApp();

	test('lists all rewards', async () => {
		LevelRepository.findAllRewardsByGuild.mockResolvedValue([
			{ id: 1, level: 5, role_id: 'role-1' },
		]);

		const res = await request(app)
			.get('/api/rewards')
			.set('X-API-Key', 'test-key');

		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
	});

	test('returns empty array when no rewards', async () => {
		LevelRepository.findAllRewardsByGuild.mockResolvedValue([]);

		const res = await request(app)
			.get('/api/rewards')
			.set('X-API-Key', 'test-key');

		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
		expect(res.body.data).toEqual([]);
	});
});

describe('POST /api/rewards', () => {
	const app = createTestApp();

	test('creates reward and returns 201', async () => {
		LevelRepository.createReward.mockResolvedValue({
			id: 1, guild_id: 'guild-1', level: 5, role_id: 'role-1',
		});

		const res = await request(app)
			.post('/api/rewards')
			.set('X-API-Key', 'test-key')
			.send({ level: 5, roleId: 'role-1' });

		expect(res.status).toBe(201);
	});

	test('returns 409 for duplicate level', async () => {
		LevelRepository.createReward.mockResolvedValue(null);

		const res = await request(app)
			.post('/api/rewards')
			.set('X-API-Key', 'test-key')
			.send({ level: 5, roleId: 'role-2' });

		expect(res.status).toBe(409);
	});
});

// ── AFK ────────────────────────────────────────────────────

describe('GET /api/afk/:userId', () => {
	const app = createTestApp();

	test('returns AFK record', async () => {
		AfkRepository.isAfk.mockResolvedValue({
			user_id: '123', guild_id: 'guild-1', reason: 'away',
		});

		const res = await request(app)
			.get('/api/afk/123')
			.set('X-API-Key', 'test-key');

		expect(res.status).toBe(200);
		expect(res.body.success).toBe(true);
	});

	test('returns 404 when user is not AFK', async () => {
		AfkRepository.isAfk.mockResolvedValue(null);

		const res = await request(app)
			.get('/api/afk/999')
			.set('X-API-Key', 'test-key');

		expect(res.status).toBe(404);
	});
});

describe('POST /api/afk', () => {
	const app = createTestApp();

	test('sets AFK and returns 201', async () => {
		AfkRepository.set.mockResolvedValue({
			user_id: '123', guild_id: 'guild-1', reason: 'sleeping',
		});

		const res = await request(app)
			.post('/api/afk')
			.set('X-API-Key', 'test-key')
			.send({ userId: '123', reason: 'sleeping' });

		expect(res.status).toBe(201);
	});

	test('returns 400 when reason is missing', async () => {
		const res = await request(app)
			.post('/api/afk')
			.set('X-API-Key', 'test-key')
			.send({ userId: '123' });

		expect(res.status).toBe(400);
	});
});

describe('DELETE /api/afk/reset', () => {
	const app = createTestApp();

	test('resets single user AFK', async () => {
		AfkRepository.isAfk.mockResolvedValue({
			user_id: '123', guild_id: 'guild-1', reason: 'away',
		});
		AfkRepository.remove.mockResolvedValue({ rowCount: 1 });

		const res = await request(app)
			.delete('/api/afk/reset')
			.set('X-API-Key', 'test-key')
			.send({ userId: '123' });

		expect(res.status).toBe(200);
	});

	test('resets all AFK when no userId', async () => {
		AfkRepository.getAfkUsers.mockResolvedValue([
			{ user_id: '1' },
			{ user_id: '2' },
			{ user_id: '3' },
		]);
		AfkRepository.removeAll.mockResolvedValue();

		const res = await request(app)
			.delete('/api/afk/reset')
			.set('X-API-Key', 'test-key');

		expect(res.status).toBe(200);
	});
});
