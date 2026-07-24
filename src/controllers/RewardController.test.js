'use strict';

const RewardService = require('../services/RewardService');

jest.mock('../services/RewardService');

describe('RewardController', () => {
	let RewardController;

	beforeAll(async () => {
		RewardController = require('./RewardController');
	});

	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe('listRewards', () => {
		test('should return rewards for a guild', async () => {
			const mockRewards = [
				{ id: 1, guild_id: 'guild1', level: 3, role_id: 'role1' },
				{ id: 2, guild_id: 'guild1', level: 5, role_id: 'role2' },
			];
			RewardService.findAllByGuild.mockResolvedValue(mockRewards);

			const result = await RewardController.listRewards('guild1');

			expect(result).toEqual(mockRewards);
			expect(RewardService.findAllByGuild).toHaveBeenCalledWith('guild1');
		});

		test('should return empty array when no rewards', async () => {
			RewardService.findAllByGuild.mockResolvedValue([]);

			const result = await RewardController.listRewards('empty');

			expect(result).toEqual([]);
		});
	});

	describe('createReward', () => {
		test('should create reward successfully', async () => {
			const mockReward = { id: 1, guild_id: 'guild1', level: 5, role_id: 'role1' };
			RewardService.create.mockResolvedValue(mockReward);

			const result = await RewardController.createReward('guild1', 5, 'role1', null);

			expect(result).toEqual(mockReward);
			expect(RewardService.create).toHaveBeenCalledWith('guild1', 5, 'role1');
		});

		test('should return null for duplicate', async () => {
			RewardService.create.mockResolvedValue(null);

			const result = await RewardController.createReward('guild1', 5, 'role2', null);

			expect(result).toBeNull();
		});
	});

	describe('deleteReward', () => {
		test('should delete reward with valid ownership', async () => {
			RewardService.verifyGuildOwnership.mockResolvedValue(true);
			RewardService.deleteById.mockResolvedValue({ rowCount: 1 });

			const result = await RewardController.deleteReward(1, 'guild1');

			expect(result).toBe(true);
			expect(RewardService.verifyGuildOwnership).toHaveBeenCalledWith(1, 'guild1');
			expect(RewardService.deleteById).toHaveBeenCalledWith(1);
		});

		test('should return false when not owned by guild', async () => {
			RewardService.verifyGuildOwnership.mockResolvedValue(false);

			const result = await RewardController.deleteReward(1, 'guild2');

			expect(result).toBe(false);
			expect(RewardService.deleteById).not.toHaveBeenCalled();
		});

		test('should return false for non-existent reward', async () => {
			RewardService.verifyGuildOwnership.mockResolvedValue(true);
			RewardService.deleteById.mockResolvedValue({ rowCount: 0 });

			const result = await RewardController.deleteReward(999, 'guild1');

			expect(result).toBe(false);
		});
	});
});
