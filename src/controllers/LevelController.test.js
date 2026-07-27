'use strict';

const LevelController = require('./LevelController');

/**
 * Test LevelController.getRank function
 */
describe('LevelController.getRank', () => {
	let levelController;
	let mockLevelService;

	beforeEach(() => {
		mockLevelService = {
			findByUser: jest.fn(),
			getXPForLevel: jest.fn(),
			getLeaderboard: jest.fn(),
			setXP: jest.fn(),
			setLevel: jest.fn(),
			getLeaderboardCount: jest.fn(),
		};
		levelController = new LevelController(mockLevelService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should return rank data by calling LevelService methods', async () => {
		const userId = '123';
		const guildId = '456';

		const mockFindByUser = { id: '456-123', user: '123', guild: '456', points: 100, level: 3 };
		mockLevelService.findByUser.mockResolvedValue(mockFindByUser);
		mockLevelService.getXPForLevel.mockImplementation(level => level * 10);
		mockLevelService.getLeaderboard.mockResolvedValue([
			{ user: '123', points: 100, level: 3 },
			{ user: '456', points: 200, level: 4 },
		]);

		const result = await levelController.getRank(userId, guildId);

		expect(mockLevelService.findByUser).toHaveBeenCalledWith(userId, guildId);
		expect(mockLevelService.getLeaderboard).toHaveBeenCalledWith(guildId, 1000);
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
	let levelController;
	let mockLevelService;

	beforeEach(() => {
		mockLevelService = {
			findByUser: jest.fn(),
			getXPForLevel: jest.fn(),
			getLeaderboard: jest.fn(),
			setXP: jest.fn(),
			setLevel: jest.fn(),
			getLeaderboardCount: jest.fn(),
		};
		levelController = new LevelController(mockLevelService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should return leaderboard by calling levelService.getLeaderboard', async () => {
		const guildId = '456';
		const limit = 5;
		const mockLeaderboard = [
			{ id: '1', user: '123', guild: '456', points: 100, level: 3 },
			{ id: '2', user: '456', guild: '456', points: 200, level: 4 },
		];
		mockLevelService.getLeaderboard.mockResolvedValue(mockLeaderboard);

		const result = await levelController.getLeaderboard(guildId, limit);

		expect(mockLevelService.getLeaderboard).toHaveBeenCalledWith(guildId, limit, 0);
		expect(result).toEqual(mockLeaderboard);
	});
});

/**
 * Test LevelController.setXP function
 */
describe('LevelController.setXP', () => {
	let levelController;
	let mockLevelService;

	beforeEach(() => {
		mockLevelService = {
			findByUser: jest.fn(),
			getXPForLevel: jest.fn(),
			getLeaderboard: jest.fn(),
			setXP: jest.fn(),
			setLevel: jest.fn(),
			getLeaderboardCount: jest.fn(),
		};
		levelController = new LevelController(mockLevelService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should set XP by calling levelService.setXP', async () => {
		const userId = '123';
		const guildId = '456';
		const xp = 150;
		const mockResult = { points: 150, level: 5, oldLevel: 3 };
		mockLevelService.setXP.mockResolvedValue(mockResult);

		const result = await levelController.setXP(userId, guildId, xp);

		expect(mockLevelService.setXP).toHaveBeenCalledWith(userId, guildId, xp);
		expect(result).toEqual(mockResult);
	});
});

/**
 * Test LevelController.setLevel function
 */
describe('LevelController.setLevel', () => {
	let levelController;
	let mockLevelService;

	beforeEach(() => {
		mockLevelService = {
			findByUser: jest.fn(),
			getXPForLevel: jest.fn(),
			getLeaderboard: jest.fn(),
			setXP: jest.fn(),
			setLevel: jest.fn(),
			getLeaderboardCount: jest.fn(),
		};
		levelController = new LevelController(mockLevelService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should set level by calling levelService.setLevel', async () => {
		const userId = '123';
		const guildId = '456';
		const level = 10;
		const mockResult = { points: 1000, level: 10, oldLevel: 3 };
		mockLevelService.setLevel.mockResolvedValue(mockResult);

		const result = await levelController.setLevel(userId, guildId, level);

		expect(mockLevelService.setLevel).toHaveBeenCalledWith(userId, guildId, level);
		expect(result).toEqual(mockResult);
	});
});
