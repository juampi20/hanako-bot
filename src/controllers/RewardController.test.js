'use strict';

const MockRewardService = require('../services/RewardService');

jest.mock('../services/RewardService');

describe('RewardController', () => {
	let rewardService;
	let rewardController;

	beforeEach(() => {
		rewardService = new MockRewardService();
		const RewardController = require('./RewardController');
		rewardController = new RewardController(rewardService);
		jest.clearAllMocks();
	});

	describe('listRewards', () => {
		test('should return rewards for a guild', async () => {
			const mockRewards = [
				{ id: 1, guild_id: 'guild1', level: 3, role_id: 'role1' },
				{ id: 2, guild_id: 'guild1', level: 5, role_id: 'role2' },
			];
			rewardService.findAllByGuild.mockResolvedValue(mockRewards);

			const result = await rewardController.listRewards('guild1');

			expect(result).toEqual(mockRewards);
			expect(rewardService.findAllByGuild).toHaveBeenCalledWith('guild1');
		});

		test('should return empty array when no rewards', async () => {
			rewardService.findAllByGuild.mockResolvedValue([]);

			const result = await rewardController.listRewards('empty');

			expect(result).toEqual([]);
		});
	});

	describe('createReward', () => {
		test('should create reward successfully', async () => {
			const mockReward = { id: 1, guild_id: 'guild1', level: 5, role_id: 'role1' };
			rewardService.create.mockResolvedValue(mockReward);

			const result = await rewardController.createReward('guild1', 5, 'role1', null);

			expect(result).toEqual(mockReward);
			expect(rewardService.create).toHaveBeenCalledWith('guild1', 5, 'role1');
		});

		test('should return null for duplicate', async () => {
			rewardService.create.mockResolvedValue(null);

			const result = await rewardController.createReward('guild1', 5, 'role2', null);

			expect(result).toBeNull();
		});
	});

	describe('deleteReward', () => {
		test('should delete reward with valid ownership', async () => {
			rewardService.verifyGuildOwnership.mockResolvedValue(true);
			rewardService.deleteById.mockResolvedValue({ rowCount: 1 });

			const result = await rewardController.deleteReward(1, 'guild1');

			expect(result).toBe(true);
			expect(rewardService.verifyGuildOwnership).toHaveBeenCalledWith(1, 'guild1');
			expect(rewardService.deleteById).toHaveBeenCalledWith(1);
		});

		test('should return false when not owned by guild', async () => {
			rewardService.verifyGuildOwnership.mockResolvedValue(false);

			const result = await rewardController.deleteReward(1, 'guild2');

			expect(result).toBe(false);
			expect(rewardService.deleteById).not.toHaveBeenCalled();
		});

		test('should return false for non-existent reward', async () => {
			rewardService.verifyGuildOwnership.mockResolvedValue(true);
			rewardService.deleteById.mockResolvedValue({ rowCount: 0 });

			const result = await rewardController.deleteReward(999, 'guild1');

			expect(result).toBe(false);
		});
	});
});
