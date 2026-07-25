'use strict';

const RewardService = require('./RewardService');
const MockRewardRepository = require('../repositories/__mocks__/RewardRepository');

describe('RewardService', () => {
	let repo;

	beforeEach(() => {
		repo = new MockRewardRepository();
		RewardService.useRepository(repo);
	});

	afterEach(() => {
		repo.rewards.clear();
	});

	describe('useRepository injection guard', () => {
		test('should guard against non-repository injection', () => {
			expect(() => RewardService.useRepository({ notA: 'repo' })).toThrow('Invalid repository instance');
		});
	});

	describe('create', () => {
		test('should create a new reward', async () => {
			const reward = await RewardService.create('guild1', 5, 'role123');
			expect(reward).toEqual({ id: expect.any(Number), guild_id: 'guild1', level: 5, role_id: 'role123' });
			expect(repo.rewards.size).toBe(1);
		});

		test('should return null for duplicate reward', async () => {
			await RewardService.create('guild1', 5, 'role123');
			const reward2 = await RewardService.create('guild1', 5, 'role456');
			expect(reward2).toBeNull();
			expect(repo.rewards.size).toBe(1);
		});
	});

	describe('findByGuildAndLevel', () => {
		test('should find reward by guild and level', async () => {
			await RewardService.create('guild1', 3, 'role123');
			const reward = await RewardService.findByGuildAndLevel('guild1', 3);
			expect(reward).toEqual({ id: expect.any(Number), guild_id: 'guild1', level: 3, role_id: 'role123' });
		});

		test('should return null when reward not found', async () => {
			const reward = await RewardService.findByGuildAndLevel('guild1', 999);
			expect(reward).toBeNull();
		});
	});

	describe('findById', () => {
		test('should find reward by ID', async () => {
			const created = await RewardService.create('guild1', 7, 'role123');
			const reward = await RewardService.findById(created.id);
			expect(reward).toEqual(created);
		});

		test('should return null for non-existent ID', async () => {
			const reward = await RewardService.findById(999);
			expect(reward).toBeNull();
		});
	});

	describe('findAllByGuild', () => {
		test('should find all rewards for a guild', async () => {
			await RewardService.create('guild1', 2, 'role1');
			await RewardService.create('guild1', 4, 'role2');
			await RewardService.create('guild2', 3, 'role3');

			const rewards = await RewardService.findAllByGuild('guild1');
			expect(rewards).toHaveLength(2);
			expect(rewards.map(r => r.level)).toEqual([2, 4]);
		});

		test('should return empty array for guild with no rewards', async () => {
			const rewards = await RewardService.findAllByGuild('guild999');
			expect(rewards).toEqual([]);
		});
	});

	describe('deleteById', () => {
		test('should delete existing reward', async () => {
			const created = await RewardService.create('guild1', 10, 'role123');
			const result = await RewardService.deleteById(created.id);
			expect(result.rowCount).toBe(1);
			const reward = await RewardService.findById(created.id);
			expect(reward).toBeNull();
		});

		test('should return rowCount 0 for non-existent ID', async () => {
			const result = await RewardService.deleteById(999);
			expect(result.rowCount).toBe(0);
		});
	});

	describe('verifyGuildOwnership', () => {
		test('should verify guild ownership when true', async () => {
			const created = await RewardService.create('guild1', 5, 'role123');
			const isOwned = await RewardService.verifyGuildOwnership(created.id, 'guild1');
			expect(isOwned).toBe(true);
		});

		test('should return false for wrong guild ownership', async () => {
			const created = await RewardService.create('guild1', 5, 'role123');
			const isOwned = await RewardService.verifyGuildOwnership(created.id, 'guild2');
			expect(isOwned).toBe(false);
		});

		test('should return false for non-existent ID', async () => {
			const isOwned = await RewardService.verifyGuildOwnership(999, 'guild1');
			expect(isOwned).toBe(false);
		});
	});
});
