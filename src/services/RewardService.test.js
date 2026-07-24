'use strict';

const RewardService = require('./RewardService');

// Mock implementation of RewardRepository for testing
const mockRepository = {
	create: jest.fn(),
	findByGuildAndLevel: jest.fn(),
	findById: jest.fn(),
	findAllByGuild: jest.fn(),
	deleteById: jest.fn(),
	verifyGuildOwnership: jest.fn(),
};

describe('RewardService', () => {
	beforeAll(() => {
		RewardService.useRepository(mockRepository);
	});

	beforeEach(() => {
		mockRepository.create.mockClear();
		mockRepository.findByGuildAndLevel.mockClear();
		mockRepository.findById.mockClear();
		mockRepository.findAllByGuild.mockClear();
		mockRepository.deleteById.mockClear();
		mockRepository.verifyGuildOwnership.mockClear();
	});

	describe('create', () => {
		it('should create a new reward', async () => {
			const reward = { id: 1, guild_id: 'guild1', level: 1, role_id: 'role1' };
			mockRepository.create.mockResolvedValueOnce(reward);

			const result = await RewardService.create('guild1', 1, 'role1');

			expect(result).toEqual(reward);
			expect(mockRepository.create).toHaveBeenCalledWith('guild1', 1, 'role1');
		});

		it('should return null on duplicate', async () => {
			mockRepository.create.mockResolvedValueOnce(null);

			const result = await RewardService.create('guild2', 2, 'role2');

			expect(result).toBeNull();
			expect(mockRepository.create).toHaveBeenCalledWith('guild2', 2, 'role2');
		});
	});

	describe('findByGuildAndLevel', () => {
		it('should find reward by guild and level', async () => {
			const reward = { id: 1, guild_id: 'guild1', level: 2, role_id: 'role2' };
			mockRepository.findByGuildAndLevel.mockResolvedValueOnce(reward);

			const result = await RewardService.findByGuildAndLevel('guild1', 2);

			expect(result).toEqual(reward);
			expect(mockRepository.findByGuildAndLevel).toHaveBeenCalledWith('guild1', 2);
		});

		it('should return null if not found', async () => {
			mockRepository.findByGuildAndLevel.mockResolvedValueOnce(null);

			const result = await RewardService.findByGuildAndLevel('guild1', 3);

			expect(result).toBeNull();
			expect(mockRepository.findByGuildAndLevel).toHaveBeenCalledWith('guild1', 3);
		});
	});

	describe('findById', () => {
		it('should find reward by ID', async () => {
			const reward = { id: 10, guild_id: 'guild1', level: 5, role_id: 'role5' };
			mockRepository.findById.mockResolvedValueOnce(reward);

			const result = await RewardService.findById(10);

			expect(result).toEqual(reward);
			expect(mockRepository.findById).toHaveBeenCalledWith(10);
		});

		it('should return null if not found', async () => {
			mockRepository.findById.mockResolvedValueOnce(null);

			const result = await RewardService.findById(999);

			expect(result).toBeNull();
			expect(mockRepository.findById).toHaveBeenCalledWith(999);
		});
	});

	describe('findAllByGuild', () => {
		it('should return all rewards for a guild', async () => {
			const rewards = [
				{ id: 1, guild_id: 'guild1', level: 1, role_id: 'role1' },
				{ id: 2, guild_id: 'guild1', level: 2, role_id: 'role2' },
			];
			mockRepository.findAllByGuild.mockResolvedValueOnce(rewards);

			const result = await RewardService.findAllByGuild('guild1');

			expect(result).toEqual(rewards);
			expect(mockRepository.findAllByGuild).toHaveBeenCalledWith('guild1');
		});

		it('should return empty array if none exist', async () => {
			mockRepository.findAllByGuild.mockResolvedValueOnce([]);

			const result = await RewardService.findAllByGuild('guild999');

			expect(result).toEqual([]);
			expect(mockRepository.findAllByGuild).toHaveBeenCalledWith('guild999');
		});
	});

	describe('deleteById', () => {
		it('should delete reward by ID', async () => {
			const result = { rowCount: 1 };
			mockRepository.deleteById.mockResolvedValueOnce(result);

			const output = await RewardService.deleteById(10);

			expect(output).toEqual(result);
			expect(mockRepository.deleteById).toHaveBeenCalledWith(10);
		});

		it('should return rowCount 0 if nothing deleted', async () => {
			const result = { rowCount: 0 };
			mockRepository.deleteById.mockResolvedValueOnce(result);

			const output = await RewardService.deleteById(999);

			expect(output).toEqual(result);
			expect(mockRepository.deleteById).toHaveBeenCalledWith(999);
		});
	});

	describe('verifyGuildOwnership', () => {
		it('should verify ownership when true', async () => {
			mockRepository.verifyGuildOwnership.mockResolvedValueOnce(true);

			const result = await RewardService.verifyGuildOwnership(1, 'guild1');

			expect(result).toBe(true);
			expect(mockRepository.verifyGuildOwnership).toHaveBeenCalledWith(1, 'guild1');
		});

		it('should verify ownership when false (reward not found)', async () => {
			mockRepository.verifyGuildOwnership.mockResolvedValueOnce(false);

			const result = await RewardService.verifyGuildOwnership(999, 'guild1');

			expect(result).toBe(false);
			expect(mockRepository.verifyGuildOwnership).toHaveBeenCalledWith(999, 'guild1');
		});
	});

	describe('useRepository', () => {
		it('should inject repository', () => {
			// Test that repository is injected properly
			RewardService.useRepository(mockRepository);
		});
	});
});