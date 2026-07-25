'use strict';

const LevelRepository = require('./LevelRepository');
const ILevelRepository = require('./ILevelRepository');

// Mock del pool de PostgreSQL
const mockPool = {
	query: jest.fn(),
};

beforeEach(() => {
	mockPool.query.mockClear();
});

describe('LevelRepository', () => {
	let repository;

	beforeEach(() => {
		mockPool.query.mockClear();
		repository = new LevelRepository(mockPool);
	});

	it('should extend ILevelRepository', () => {
		expect(repository).toBeInstanceOf(ILevelRepository);
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
                  ON CONFLICT (id) DO UPDATE SET points = EXCLUDED.points, level = EXCLUDED.level
                  RETURNING *`,
				[data.id, data.user, data.guild, data.points, data.level],
			);
		});

		it('should update an existing score by replacing points and setting level', async () => {
			const data = { id: 'guild1-user1', user: 'user1', guild: 'guild1', points: 30, level: 2 };
			const mockResult = { id: 'guild1-user1', user: 'user1', guild: 'guild1', points: 30, level: 2 };
			mockPool.query.mockResolvedValueOnce({ rows: [mockResult] });

			const result = await repository.upsert(data);
			expect(result).toEqual(mockResult);
			expect(mockPool.query).toHaveBeenCalledWith(
				`INSERT INTO scores (id, "user", guild, points, level)
                  VALUES ($1, $2, $3, $4, $5)
                  ON CONFLICT (id) DO UPDATE SET points = EXCLUDED.points, level = EXCLUDED.level
                  RETURNING *`,
				[data.id, data.user, data.guild, data.points, data.level],
			);
		});
	});

	describe('getLeaderboard', () => {
		it('should return empty array for guild with no scores', async () => {
			mockPool.query.mockResolvedValueOnce({ rows: [] });
			const result = await repository.getLeaderboard('guild1', 5);
			expect(result).toEqual([]);
			expect(mockPool.query).toHaveBeenCalledWith(
				'SELECT * FROM scores WHERE guild = $1 ORDER BY points DESC, level DESC LIMIT $2',
				['guild1', 5],
			);
		});

		it('should return top scores', async () => {
			const mockScores = [
				{ id: 'guild1-user1', user: 'user1', guild: 'guild1', points: 200, level: 5 },
				{ id: 'guild1-user2', user: 'user2', guild: 'guild1', points: 150, level: 4 },
			];
			mockPool.query.mockResolvedValueOnce({ rows: mockScores });

			const result = await repository.getLeaderboard('guild1', 2);
			expect(result).toEqual(mockScores);
			expect(mockPool.query).toHaveBeenCalledWith(
				'SELECT * FROM scores WHERE guild = $1 ORDER BY points DESC, level DESC LIMIT $2',
				['guild1', 2],
			);
		});
	});
});