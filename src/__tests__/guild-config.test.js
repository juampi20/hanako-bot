'use strict';

const botConfig = require('../config/bot');
const SETTINGS_REGISTRY = botConfig.SETTINGS_REGISTRY;

// ── Validation helpers (mirror from config.js) ────────────────

function validateValue(key, rawValue) {
	const def = SETTINGS_REGISTRY[key];
	if (!def) throw new Error(`La clave '${key}' no existe en el registro.`);

	let value = rawValue;

	switch (def.type) {
	case 'string':
		if (typeof value !== 'string' || value.trim() === '') {throw new Error('El valor debe ser un texto no vacío.');}
		value = value.trim();
		break;

	case 'number':
		value = Number(value);
		if (!Number.isInteger(value)) {throw new Error('El valor debe ser un número entero.');}
		if (value < 1) {throw new Error('El valor debe ser mayor o igual a 1.');}
		break;

	case 'boolean':
		if (value === 'true' || value === true) value = true;
		else if (value === 'false' || value === false) value = false;
		else throw new Error('El valor debe ser \'true\' o \'false\'.');
		break;

	case 'snowflake':
		if (typeof value !== 'string' || !/^\d{17,20}$/.test(value)) {throw new Error('El valor debe ser un ID de Discord válido (17-20 dígitos).');}
		break;
	}

	return value;
}

// ── Validation tests ──────────────────────────────────────────

describe('Config validation', () => {
	test('validates string: prefix', () => {
		expect(validateValue('prefix', '?')).toBe('?');
	});

	test('rejects empty string', () => {
		expect(() => validateValue('prefix', '')).toThrow('no vacío');
	});

	test('validates number: chat-xp-min', () => {
		expect(validateValue('chat-xp-min', '30')).toBe(30);
	});

	test('rejects non-integer number', () => {
		expect(() => validateValue('chat-xp-min', 'abc')).toThrow('número entero');
	});

	test('rejects number < 1', () => {
		expect(() => validateValue('chat-xp-min', '0')).toThrow('mayor o igual a 1');
	});

	test('validates boolean true', () => {
		expect(validateValue('level-up-notify', 'true')).toBe(true);
	});

	test('validates boolean false', () => {
		expect(validateValue('level-up-notify', 'false')).toBe(false);
	});

	test('rejects invalid boolean', () => {
		expect(() => validateValue('level-up-notify', 'maybe')).toThrow('true');
	});

	test('validates snowflake', () => {
		expect(validateValue('level-up-channel', '123456789012345678')).toBe('123456789012345678');
	});

	test('rejects invalid snowflake', () => {
		expect(() => validateValue('level-up-channel', 'not-an-id')).toThrow('ID de Discord');
	});

	test('rejects unknown key', () => {
		expect(() => validateValue('nonexistent', 'x')).toThrow('no existe en el registro');
	});
});

// ── Settings registry tests ────────────────────────────────────

describe('Settings registry', () => {
	test('exports SETTINGS_REGISTRY', () => {
		expect(SETTINGS_REGISTRY).toBeDefined();
	});

	test('has exactly 12 keys', () => {
		expect(Object.keys(SETTINGS_REGISTRY)).toHaveLength(12);
	});

	test('each key has env, type, default, description', () => {
		for (const key of Object.keys(SETTINGS_REGISTRY)) {
			expect(SETTINGS_REGISTRY[key]).toHaveProperty('env');
			expect(SETTINGS_REGISTRY[key]).toHaveProperty('type');
			expect(SETTINGS_REGISTRY[key]).toHaveProperty('default');
			expect(SETTINGS_REGISTRY[key]).toHaveProperty('description');
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
