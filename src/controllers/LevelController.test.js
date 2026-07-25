'use strict';

const LevelController = require('../controllers/LevelController');
const LevelService = require('../services/LevelService');

/**
 * Test LevelController.getRank function
 */
describe('LevelController.getRank', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should return rank data by calling LevelService methods', async () => {
		const userId = '123';
		const guildId = '456';

		const mockFindByUser = { id: '456-123', user: '123', guild: '456', points: 100, level: 3 };
		LevelService.findByUser = jest.fn().mockResolvedValue(mockFindByUser);
		LevelService.getXPForLevel = jest.fn(level => level * 10);
		LevelService.getLeaderboard = jest.fn().mockResolvedValue([
			{ user: '123', points: 100, level: 3 },
			{ user: '456', points: 200, level: 4 },
		]);

		const result = await LevelController.getRank(userId, guildId);

		expect(LevelService.findByUser).toHaveBeenCalledWith(userId, guildId);
		expect(LevelService.getLeaderboard).toHaveBeenCalledWith(guildId, 1000);
		expect(result).toEqual({
			score: mockFindByUser,
			xpForCurrent: 30,
			xpForNext: 40,
			xpFloor: 30,
			xpIntoLevel: 70,
			xpNeeded: 10,
			rank: 1,
		});
	});
});

/**
 * Test LevelController.getLeaderboard function
 */
describe('LevelController.getLeaderboard', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should return leaderboard by calling LevelService.getLeaderboard', async () => {
		const guildId = '456';
		const limit = 5;
		const mockLeaderboard = [
			{ id: '1', user: '123', guild: '456', points: 100, level: 3 },
			{ id: '2', user: '456', guild: '456', points: 200, level: 4 },
		];
		LevelService.getLeaderboard = jest.fn().mockResolvedValue(mockLeaderboard);

		const result = await LevelController.getLeaderboard(guildId, limit);

		expect(LevelService.getLeaderboard).toHaveBeenCalledWith(guildId, limit, 0);
		expect(result).toEqual(mockLeaderboard);
	});
});

/**
 * Test LevelController.setXP function
 */
describe('LevelController.setXP', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should set XP by calling LevelService.setXP', async () => {
		const userId = '123';
		const guildId = '456';
		const xp = 150;
		const mockResult = { points: 150, level: 5, oldLevel: 3 };
		LevelService.setXP = jest.fn().mockResolvedValue(mockResult);

		const result = await LevelController.setXP(userId, guildId, xp);

		expect(LevelService.setXP).toHaveBeenCalledWith(userId, guildId, xp);
		expect(result).toEqual(mockResult);
	});
});

/**
 * Test LevelController.setLevel function
 */
describe('LevelController.setLevel', () => {
	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should set level by calling LevelService.setLevel', async () => {
		const userId = '123';
		const guildId = '456';
		const level = 10;
		const mockResult = { points: 1000, level: 10, oldLevel: 3 };
		LevelService.setLevel = jest.fn().mockResolvedValue(mockResult);

		const result = await LevelController.setLevel(userId, guildId, level);

		expect(LevelService.setLevel).toHaveBeenCalledWith(userId, guildId, level);
		expect(result).toEqual(mockResult);
	});
});