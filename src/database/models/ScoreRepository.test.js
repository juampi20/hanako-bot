'use strict';

const ScoreRepository = require('./ScoreRepository');
const IScoreRepository = require('./IScoreRepository');

// Mock del pool de PostgreSQL
const mockPool = {
	query: jest.fn(),
};

beforeEach(() => {
	mockPool.query.mockClear();
});

describe('ScoreRepository', () => {
	let repository;

	beforeEach(() => {
		mockPool.query.mockClear();
		repository = new ScoreRepository(mockPool);
	});

	it('should extend IScoreRepository', () => {
		expect(repository).toBeInstanceOf(IScoreRepository);
	});

	describe('createTable', () => {
		it('should call pool.query with the correct SQL', async () => {
			mockPool.query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] });
			await repository.createTable();
			expect(mockPool.query).toHaveBeenCalledTimes(2);

			const firstCall = mockPool.query.mock.calls[0];
			expect(firstCall[0]).toMatch(/CREATE TABLE IF NOT EXISTS scores/);
			expect(firstCall[0]).toContain('id TEXT PRIMARY KEY');
			expect(firstCall[0]).toContain('"user" TEXT NOT NULL');
			expect(firstCall[0]).toContain('guild TEXT NOT NULL');
			expect(firstCall[0]).toContain('points INTEGER NOT NULL DEFAULT 0');
			expect(firstCall[0]).toContain('level INTEGER NOT NULL DEFAULT 1');

			const secondCall = mockPool.query.mock.calls[1];
			expect(secondCall[0]).toBe('CREATE UNIQUE INDEX IF NOT EXISTS idx_scores_id ON scores (id)');
		});
	});

	describe('findByUser', () => {
		it('should return null if user not found', async () => {
			mockPool.query.mockResolvedValueOnce({ rows: [] });
			const result = await repository.findByUser('user1', 'guild1');
			expect(result).toBeNull();
			expect(mockPool.query).toHaveBeenCalledWith(
				'SELECT * FROM scores WHERE "user" = $1 AND guild = $2',
				['user1', 'guild1'],
			);
		});

		it('should return the score if user exists', async () => {
			const mockScore = { id: 'guild1-user1', user: 'user1', guild: 'guild1', points: 100, level: 2 };
			mockPool.query.mockResolvedValueOnce({ rows: [mockScore] });

			const result = await repository.findByUser('user1', 'guild1');
			expect(result).toEqual(mockScore);
			expect(mockPool.query).toHaveBeenCalledWith(
				'SELECT * FROM scores WHERE "user" = $1 AND guild = $2',
				['user1', 'guild1'],
			);
		});


	});

	describe('upsert', () => {
		it('should insert a new score if not exists', async () => {
			const data = { id: 'guild1-user1', user: 'user1', guild: 'guild1', points: 50, level: 1 };
			const mockResult = { ...data };
			mockPool.query.mockResolvedValueOnce({ rows: [mockResult] });

			const result = await repository.upsert(data);
			expect(result).toEqual(mockResult);
			expect(mockPool.query).toHaveBeenCalledWith(
				`INSERT INTO scores (id, "user", guild, points, level)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO UPDATE SET points = scores.points + EXCLUDED.points, level = EXCLUDED.level
             RETURNING *`,
				[data.id, data.user, data.guild, data.points, data.level],
			);
		});

		it('should update an existing score by adding points and setting level', async () => {
			const data = { id: 'guild1-user1', user: 'user1', guild: 'guild1', points: 30, level: 2 };
			const mockResult = { id: 'guild1-user1', user: 'user1', guild: 'guild1', points: 80, level: 2 };
			mockPool.query.mockResolvedValueOnce({ rows: [mockResult] });

			const result = await repository.upsert(data);
			expect(result).toEqual(mockResult);
			expect(mockPool.query).toHaveBeenCalledWith(
				`INSERT INTO scores (id, "user", guild, points, level)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (id) DO UPDATE SET points = scores.points + EXCLUDED.points, level = EXCLUDED.level
             RETURNING *`,
				[data.id, data.user, data.guild, data.points, data.level],
			);
		});
	});

	describe('getLeaderboard', () => {
		it('should return an empty array if no scores exist', async () => {
			mockPool.query.mockResolvedValueOnce({ rows: [] });
			const result = await repository.getLeaderboard('guild1');
			expect(result).toEqual([]);
			expect(mockPool.query).toHaveBeenCalledWith(
				'SELECT * FROM scores WHERE guild = $1 ORDER BY points DESC, level DESC LIMIT $2',
				['guild1', 10],
			);
		});

		it('should return top scores sorted by points and level', async () => {
			const mockScores = [
				{ id: 'guild1-user2', user: 'user2', guild: 'guild1', points: 150, level: 3 },
				{ id: 'guild1-user1', user: 'user1', guild: 'guild1', points: 100, level: 2 },
			];
			mockPool.query.mockResolvedValueOnce({ rows: mockScores });

			const result = await repository.getLeaderboard('guild1', 2);
			expect(result).toEqual(mockScores);
			expect(mockPool.query).toHaveBeenCalledWith(
				'SELECT * FROM scores WHERE guild = $1 ORDER BY points DESC, level DESC LIMIT $2',
				['guild1', 2],
			);
		});

		it('should respect the limit parameter', async () => {
			mockPool.query.mockResolvedValueOnce({ rows: [] });
			await repository.getLeaderboard('guild1', 5);
			expect(mockPool.query).toHaveBeenCalledWith(
				'SELECT * FROM scores WHERE guild = $1 ORDER BY points DESC, level DESC LIMIT $2',
				['guild1', 5],
			);
		});
	});
});