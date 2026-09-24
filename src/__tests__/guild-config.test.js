'use strict';

const botConfig = require('../config/bot');
const SETTINGS_REGISTRY = botConfig.SETTINGS_REGISTRY;

// ── Settings registry tests ────────────────────────────────────

describe('Settings registry', () => {
	test('exports SETTINGS_REGISTRY', () => {
		expect(SETTINGS_REGISTRY).toBeDefined();
	});

	test('has exactly 20 keys', () => {
		expect(Object.keys(SETTINGS_REGISTRY)).toHaveLength(20);
	});

	test('each key has env, type, default, description, configKey', () => {
		for (const key of Object.keys(SETTINGS_REGISTRY)) {
			expect(SETTINGS_REGISTRY[key]).toHaveProperty('env');
			expect(SETTINGS_REGISTRY[key]).toHaveProperty('type');
			expect(SETTINGS_REGISTRY[key]).toHaveProperty('default');
			expect(SETTINGS_REGISTRY[key]).toHaveProperty('description');
			expect(SETTINGS_REGISTRY[key]).toHaveProperty('configKey');
		}
	});

	test('prefix default is "!"', () => {
		expect(SETTINGS_REGISTRY['prefix'].default).toBe('!');
	});
});

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

	test('getAll calls correct SQL', async () => {
		mockPool.query.mockResolvedValue({ rows: [{ key: 'prefix', value: '?' }] });
		const result = await repo.getAll('guild-1');
		expect(mockPool.query).toHaveBeenCalledWith(
			expect.stringContaining('SELECT key, value FROM guild_config'),
			['guild-1'],
		);
		expect(result).toEqual([{ key: 'prefix', value: '?' }]);
	});

	test('get returns value when found', async () => {
		mockPool.query.mockResolvedValue({ rows: [{ value: '?' }] });
		const result = await repo.get('guild-1', 'prefix');
		expect(result).toBe('?');
	});

	test('get returns null when not found', async () => {
		mockPool.query.mockResolvedValue({ rows: [] });
		const result = await repo.get('guild-1', 'prefix');
		expect(result).toBeNull();
	});

	test('set upserts via ON CONFLICT', async () => {
		mockPool.query.mockResolvedValue({ rows: [{ guild_id: 'guild-1', key: 'prefix', value: '?' }] });
		const result = await repo.set('guild-1', 'prefix', '?');
		expect(mockPool.query).toHaveBeenCalledWith(
			expect.stringContaining('ON CONFLICT'),
			['guild-1', 'prefix', '?'],
		);
		expect(result.key).toBe('prefix');
	});

	test('remove deletes row', async () => {
		mockPool.query.mockResolvedValue({ rows: [{ guild_id: 'guild-1', key: 'prefix', value: '!' }] });
		const result = await repo.remove('guild-1', 'prefix');
		expect(result.key).toBe('prefix');
	});

	test('remove returns null when row does not exist', async () => {
		mockPool.query.mockResolvedValue({ rows: [] });
		const result = await repo.remove('guild-1', 'prefix');
		expect(result).toBeNull();
	});
});
