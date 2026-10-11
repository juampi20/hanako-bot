'use strict';

// ── GuildConfigRepository tests ────────────────────────────────

describe('GuildConfigRepository', () => {
	let mockPool;
	let repo;

	beforeEach(() => {
		jest.resetModules();
		mockPool = { query: jest.fn() };
		repo = require('../database/repositories/GuildConfigRepository');
		repo.init(mockPool);
	});

	test('get returns value when found', async () => {
		mockPool.query.mockResolvedValue({ rows: [{ value: '?' }] });
		const result = await repo.get('prefix');
		expect(result).toBe('?');
	});

	test('get returns null when not found', async () => {
		mockPool.query.mockResolvedValue({ rows: [] });
		const result = await repo.get('prefix');
		expect(result).toBeNull();
	});

	test('remove deletes row', async () => {
		mockPool.query.mockResolvedValue({ rows: [{ key: 'prefix', value: '!' }] });
		const result = await repo.remove('prefix');
		expect(result.key).toBe('prefix');
	});

	test('remove returns null when row does not exist', async () => {
		mockPool.query.mockResolvedValue({ rows: [] });
		const result = await repo.remove('prefix');
		expect(result).toBeNull();
	});
});
