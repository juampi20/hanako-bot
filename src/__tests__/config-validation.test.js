'use strict';

const { validateSetting } = require('../config/validateSetting');

describe('validateSetting: string', () => {
	test('trims and returns the string value', () => {
		expect(validateSetting('prefix', '  ?!  ')).toBe('?!');
	});

	test('rejects an empty string', () => {
		expect(() => validateSetting('prefix', '')).toThrow();
	});

	test('rejects a whitespace-only string', () => {
		expect(() => validateSetting('prefix', '   ')).toThrow();
	});
});

describe('validateSetting: number', () => {
	test('coerces a numeric string to a number', () => {
		expect(validateSetting('chat-xp-min', '30')).toBe(30);
	});

	test('rejects a non-integer value', () => {
		expect(() => validateSetting('chat-xp-min', 'abc')).toThrow();
	});

	test('rejects a fractional value', () => {
		expect(() => validateSetting('chat-xp-min', '1.5')).toThrow();
	});

	test('rejects zero', () => {
		expect(() => validateSetting('chat-xp-min', 0)).toThrow();
	});

	test('rejects negative values', () => {
		expect(() => validateSetting('chat-xp-min', -5)).toThrow();
	});
});

describe('validateSetting: boolean', () => {
	test('accepts the string "true"', () => {
		expect(validateSetting('level-up-notify', 'true')).toBe(true);
	});

	test('accepts the boolean true', () => {
		expect(validateSetting('level-up-notify', true)).toBe(true);
	});

	test('accepts the string "false"', () => {
		expect(validateSetting('level-up-notify', 'false')).toBe(false);
	});

	test('accepts the boolean false', () => {
		expect(validateSetting('level-up-notify', false)).toBe(false);
	});

	test('rejects any other value', () => {
		expect(() => validateSetting('level-up-notify', 'maybe')).toThrow();
	});
});

describe('validateSetting: snowflake', () => {
	test('accepts an 18-digit ID', () => {
		expect(validateSetting('level-up-channel', '123456789012345678')).toBe('123456789012345678');
	});

	test('rejects a non-numeric value', () => {
		expect(() => validateSetting('level-up-channel', 'not-an-id')).toThrow();
	});

	test('rejects 16 digits (below the 17-digit floor)', () => {
		expect(() => validateSetting('level-up-channel', '1234567890123456')).toThrow();
	});

	test('accepts 17 digits (lower bound)', () => {
		expect(validateSetting('level-up-channel', '12345678901234567')).toBe('12345678901234567');
	});

	test('accepts 20 digits (upper bound)', () => {
		expect(validateSetting('level-up-channel', '12345678901234567890')).toBe('12345678901234567890');
	});

	test('rejects 21 digits (above the 20-digit ceiling)', () => {
		expect(() => validateSetting('level-up-channel', '123456789012345678901')).toThrow();
	});
});

describe('validateSetting: unknown key', () => {
	test('throws for a key that is not in the registry', () => {
		expect(() => validateSetting('nonexistent', 'x')).toThrow();
	});
});
