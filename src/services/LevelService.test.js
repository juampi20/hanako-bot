'use strict';

const LevelService = require('./LevelService');

// Mock de LevelRepository
const mockRepository = {
	findByUser: jest.fn(),
	upsert: jest.fn(),
};

describe('LevelService', () => {
	beforeAll(() => {
		LevelService.useRepository(mockRepository);
	});

	beforeEach(() => {
		mockRepository.findByUser.mockClear();
		mockRepository.upsert.mockClear();
	});

	describe('getLevelFromXP', () => {
		it('should return level 1 for XP <= 0', () => {
			expect(LevelService.getLevelFromXP(0)).toBe(1);
			expect(LevelService.getLevelFromXP(-10)).toBe(1);
		});

		it('should return correct level for given XP', () => {
			expect(LevelService.getLevelFromXP(100)).toBe(1);
			// Level 2 requires 630 XP (330*1^2 + 300*1)
			expect(LevelService.getLevelFromXP(330)).toBe(1);
			expect(LevelService.getLevelFromXP(630)).toBe(2);
			// Level 3 requires 1920 XP (330*2^2 + 300*2)
			expect(LevelService.getLevelFromXP(990)).toBe(2);
			expect(LevelService.getLevelFromXP(1920)).toBe(3);
		});
	});

	describe('getXPForLevel', () => {
		it('should return 0 for level 1', () => {
			expect(LevelService.getXPForLevel(1)).toBe(0);
		});

		it('should return correct XP for given level', () => {
			// Formula: xp = 330(N-1)^2 + 300(N-1)
			expect(LevelService.getXPForLevel(2)).toBe(630);
			expect(LevelService.getXPForLevel(3)).toBe(1920);
			expect(LevelService.getXPForLevel(4)).toBe(3870);
		});
	});

	describe('addXP', () => {
		it('should return null if amount is invalid', async () => {
			const result = await LevelService.addXP('user1', 'guild1', 0);
			expect(result).toBeNull();
		});

		it('should add XP and recalculate level', async () => {
			// Mock para findByUser (usuario nuevo)
			mockRepository.findByUser.mockResolvedValueOnce({
				id: 'guild1-user1',
				user: 'user1',
				guild: 'guild1',
				points: 0,
				level: 1,
			});
			// Mock para upsert (primer llamado)
			mockRepository.upsert.mockResolvedValueOnce({
				id: 'guild1-user1',
				user: 'user1',
				guild: 'guild1',
				points: 100,
				level: 1,
			});

			const result = await LevelService.addXP('user1', 'guild1', 100);
			expect(result).toEqual({
				id: 'guild1-user1',
				user: 'user1',
				guild: 'guild1',
				points: 100,
				level: 1,
				oldLevel: 1,
			});
			expect(mockRepository.findByUser).toHaveBeenCalledWith('user1', 'guild1');
			expect(mockRepository.upsert).toHaveBeenCalledWith({
				id: 'guild1-user1',
				user: 'user1',
				guild: 'guild1',
				points: 100,
				level: 1,
			});
		});
	});

	describe('setXP', () => {
		it('should return null if XP is negative', async () => {
			const result = await LevelService.setXP('user1', 'guild1', -10);
			expect(result).toBeNull();
		});

		it('should set XP and recalculate level', async () => {
			// Mock para findByUser
			mockRepository.findByUser.mockResolvedValueOnce({
				id: 'guild1-user1',
				user: 'user1',
				guild: 'guild1',
				points: 0,
				level: 1,
			});
			// Mock para upsert
			mockRepository.upsert.mockResolvedValueOnce({
				id: 'guild1-user1',
				user: 'user1',
				guild: 'guild1',
				points: 500,
				level: 1,
			});

			const result = await LevelService.setXP('user1', 'guild1', 500);
			expect(result).toEqual({
				points: 500,
				level: 1,
				oldLevel: 1,
			});
			expect(mockRepository.upsert).toHaveBeenCalledWith({
				id: 'guild1-user1',
				user: 'user1',
				guild: 'guild1',
				points: 500,
				level: 1,
			});
		});
	});

	describe('setLevel', () => {
		it('should return null if level is invalid', async () => {
			const result = await LevelService.setLevel('user1', 'guild1', 0);
			expect(result).toBeNull();
		});

		it('should set level and compute minimum XP', async () => {
			// Mock para findByUser
			mockRepository.findByUser.mockResolvedValueOnce({
				id: 'guild1-user1',
				user: 'user1',
				guild: 'guild1',
				points: 0,
				level: 1,
			});
			// Mock para upsert
			mockRepository.upsert.mockResolvedValueOnce({
				id: 'guild1-user1',
				user: 'user1',
				guild: 'guild1',
				points: 1920,
				level: 3,
			});

			const result = await LevelService.setLevel('user1', 'guild1', 3);
			expect(result).toEqual({
				points: 1920,
				level: 3,
				oldLevel: 1,
			});
			expect(mockRepository.upsert).toHaveBeenCalledWith({
				id: 'guild1-user1',
				user: 'user1',
				guild: 'guild1',
				points: 1920,
				level: 3,
			});
		});
	});
});