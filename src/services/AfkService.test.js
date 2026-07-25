'use strict';

const AfkService = require('./AfkService');

// Mock repository instance for all tests
const MockAfkRepository = require('../repositories/__mocks__/AfkRepository');
const mockRepository = new MockAfkRepository();

beforeAll(() => {
	AfkService.useRepository(mockRepository);
});

beforeEach(() => {
	// Reset mock repository before each test
	mockRepository.records.clear();
});

describe('AfkService - set operation', () => {
	it('should create AFK record when not existing', async () => {
		const result = await AfkService.set('user1', 'guild1', 'reason1', 1000);
		expect(result).toEqual({
			user_id: 'user1',
			guild_id: 'guild1',
			reason: 'reason1',
			started_at: 1000,
		});
		expect(await AfkService.isAfk('user1', 'guild1')).toEqual(result);
	});

	it('should update AFK record when existing', async () => {
		await AfkService.set('user1', 'guild1', 'reason1', 1000);
		const result = await AfkService.set('user1', 'guild1', 'reason2', 2000);
		expect(result).toEqual({
			user_id: 'user1',
			guild_id: 'guild1',
			reason: 'reason2',
			started_at: 2000,
		});
		expect((await AfkService.isAfk('user1', 'guild1')).reason).toBe('reason2');
	});
});

describe('AfkService - remove operation', () => {
	it('should remove AFK record when exists', async () => {
		await AfkService.set('user1', 'guild1', 'reason1', 1000);
		const result = await AfkService.remove('user1', 'guild1');
		expect(result).toEqual({
			user_id: 'user1',
			guild_id: 'guild1',
			reason: 'reason1',
			started_at: 1000,
		});
		expect(await AfkService.isAfk('user1', 'guild1')).toBeNull();
	});

	it('should return null when removing non-existent AFK', async () => {
		const result = await AfkService.remove('user1', 'guild1');
		expect(result).toBeNull();
	});
});

describe('AfkService - isAfk operation', () => {
	it('should return record when user is AFK', async () => {
		await AfkService.set('user1', 'guild1', 'reason1', 1000);
		const result = await AfkService.isAfk('user1', 'guild1');
		expect(result).toEqual({
			user_id: 'user1',
			guild_id: 'guild1',
			reason: 'reason1',
			started_at: 1000,
		});
	});

	it('should return null when user is not AFK', async () => {
		const result = await AfkService.isAfk('user1', 'guild1');
		expect(result).toBeNull();
	});
});

describe('AfkService - getAfkUsers operation', () => {
	it('should return empty array when no AFK users', async () => {
		const result = await AfkService.getAfkUsers('guild1');
		expect(result).toEqual([]);
	});

	it('should return all AFK users for a guild', async () => {
		await AfkService.set('user1', 'guild1', 'reason1', 1000);
		await AfkService.set('user2', 'guild1', 'reason2', 2000);
		await AfkService.set('user3', 'guild2', 'reason3', 3000);

		const result = await AfkService.getAfkUsers('guild1');
		expect(result).toHaveLength(2);
		expect(result).toEqual(expect.arrayContaining([
			{ user_id: 'user1', guild_id: 'guild1', reason: 'reason1', started_at: 1000 },
			{ user_id: 'user2', guild_id: 'guild1', reason: 'reason2', started_at: 2000 },
		]));
	});
});

describe('AfkService - removeAll operation', () => {
	it('should return empty array when removing from empty guild', async () => {
		const result = await AfkService.removeAll('guild1');
		expect(result).toEqual([]);
	});

	it('should remove all AFK records for a guild', async () => {
		await AfkService.set('user1', 'guild1', 'reason1', 1000);
		await AfkService.set('user2', 'guild1', 'reason2', 2000);
		await AfkService.set('user3', 'guild2', 'reason3', 3000);

		const result = await AfkService.removeAll('guild1');
		expect(result).toHaveLength(2);
		expect(result).toEqual(expect.arrayContaining([
			{ user_id: 'user1', guild_id: 'guild1', reason: 'reason1', started_at: 1000 },
			{ user_id: 'user2', guild_id: 'guild1', reason: 'reason2', started_at: 2000 },
		]));


		const remaining = await AfkService.getAfkUsers('guild1');
		expect(remaining).toEqual([]);

		const guild2Users = await AfkService.getAfkUsers('guild2');
		expect(guild2Users).toHaveLength(1);
	});
});

describe('AfkService - error handling (no repository)', () => {
	it('should throw error when repository not injected', async () => {
		AfkService.clearRepository();

		await expect(AfkService.set('user1', 'guild1', 'reason', 1000))
			.rejects.toThrow('AfkRepository not injected.');
		await expect(AfkService.remove('user1', 'guild1'))
			.rejects.toThrow('AfkRepository not injected.');
		await expect(AfkService.isAfk('user1', 'guild1'))
			.rejects.toThrow('AfkRepository not injected.');
		await expect(AfkService.getAfkUsers('guild1'))
			.rejects.toThrow('AfkRepository not injected.');
		await expect(AfkService.removeAll('guild1'))
			.rejects.toThrow('AfkRepository not injected.');

		// Restore repository
		AfkService.useRepository(mockRepository);
	});
});