'use strict';

const settings = require('../config/settings');

describe('settings.resolve precedence', () => {
	test('a db value wins over env and default', () => {
		const resolved = settings.resolve({ 'chat-xp-min': '42' }, { CHAT_XP_MIN: '7' });
		expect(resolved.chatXpMin).toBe(42);
	});

	test('an env value wins over the default when db has no value', () => {
		const resolved = settings.resolve({}, { CHAT_XP_MIN: '7' });
		expect(resolved.chatXpMin).toBe(7);
	});

	test('the default is used when neither db nor env provides a value', () => {
		const resolved = settings.resolve({}, {});
		expect(resolved.chatXpMin).toBe(15);
	});
});

describe('settings.resolve coercion and fall-through', () => {
	test('a db boolean string is coerced to a boolean', () => {
		expect(settings.resolve({ 'afk-autoreply': 'false' }, {}).afkAutoReply).toBe(false);
	});

	test('an env boolean string is coerced to a boolean', () => {
		expect(settings.resolve({}, { AFK_AUTOREPLY: 'false' }).afkAutoReply).toBe(false);
	});

	test('a channel env value is returned as a trimmed string', () => {
		const resolved = settings.resolve({}, { LEVEL_UP_CHANNEL_ID: ' 123456789012345678 ' });
		expect(resolved.levelUpChannel).toBe('123456789012345678');
	});

	test('an empty db value falls through to env', () => {
		const resolved = settings.resolve({ 'chat-xp-min': '' }, { CHAT_XP_MIN: '9' });
		expect(resolved.chatXpMin).toBe(9);
	});

	test('an invalid db value falls through to env', () => {
		const resolved = settings.resolve({ 'chat-xp-min': 'not-a-number' }, { CHAT_XP_MIN: '9' });
		expect(resolved.chatXpMin).toBe(9);
	});

	test('an invalid env value falls through to the default', () => {
		const resolved = settings.resolve({}, { CHAT_XP_MIN: '0' });
		expect(resolved.chatXpMin).toBe(15);
	});

	test('resolve without arguments returns every default', () => {
		expect(settings.resolve()).toEqual(settings.defaults());
	});
});

describe('settings.validate: number', () => {
	test('coerces a numeric string to a number', () => {
		expect(settings.validate('chat-xp-min', '30')).toBe(30);
	});

	test('rejects a non-integer value', () => {
		expect(() => settings.validate('chat-xp-min', 'abc')).toThrow();
	});

	test('rejects a fractional value', () => {
		expect(() => settings.validate('chat-xp-min', '1.5')).toThrow();
	});

	test('rejects zero', () => {
		expect(() => settings.validate('chat-xp-min', 0)).toThrow();
	});

	test('rejects negative values', () => {
		expect(() => settings.validate('chat-xp-min', -5)).toThrow();
	});
});

describe('settings.validate: boolean', () => {
	test('accepts the string "true"', () => {
		expect(settings.validate('level-up-notify', 'true')).toBe(true);
	});

	test('accepts the boolean true', () => {
		expect(settings.validate('level-up-notify', true)).toBe(true);
	});

	test('accepts the string "false"', () => {
		expect(settings.validate('level-up-notify', 'false')).toBe(false);
	});

	test('accepts the boolean false', () => {
		expect(settings.validate('level-up-notify', false)).toBe(false);
	});

	test('rejects any other value', () => {
		expect(() => settings.validate('level-up-notify', 'maybe')).toThrow();
	});
});

describe('settings.validate: role and channel', () => {
	test('accepts an 18-digit channel ID', () => {
		expect(settings.validate('level-up-channel', '123456789012345678')).toBe('123456789012345678');
	});

	test('accepts a 17-digit role ID', () => {
		expect(settings.validate('moderator-role', '12345678901234567')).toBe('12345678901234567');
	});

	test('accepts 20 digits (upper bound)', () => {
		expect(settings.validate('level-up-channel', '12345678901234567890')).toBe('12345678901234567890');
	});

	test('rejects a non-numeric value', () => {
		expect(() => settings.validate('level-up-channel', 'not-an-id')).toThrow();
	});

	test('rejects 16 digits (below the 17-digit floor)', () => {
		expect(() => settings.validate('level-up-channel', '1234567890123456')).toThrow();
	});

	test('rejects 21 digits (above the 20-digit ceiling)', () => {
		expect(() => settings.validate('level-up-channel', '123456789012345678901')).toThrow();
	});
});

describe('settings.validate: unknown keys', () => {
	test('throws for a key that is not in the schema', () => {
		expect(() => settings.validate('nonexistent', 'x')).toThrow();
	});

	test('throws for the removed prefix key', () => {
		expect(() => settings.validate('prefix', '!')).toThrow();
	});
});

describe('settings.defaults and keys', () => {
	test('defaults include afkAutoReply set to true', () => {
		expect(settings.defaults().afkAutoReply).toBe(true);
	});

	test('defaults exclude prefix', () => {
		expect(settings.defaults()).not.toHaveProperty('prefix');
	});

	test('keys exclude prefix', () => {
		expect(settings.keys()).not.toContain('prefix');
	});

	test('keys include a role and a channel setting', () => {
		expect(settings.keys()).toContain('moderator-role');
		expect(settings.keys()).toContain('level-up-channel');
	});
});

describe('settings.get', () => {
	test('returns metadata for a known key', () => {
		expect(settings.get('chat-xp-min')).toEqual({
			env: 'CHAT_XP_MIN',
			type: 'number',
			default: 15,
			configKey: 'chatXpMin',
			description: 'Minimum XP per chat message',
			group: 'XP',
		});
	});

	test('returns undefined for an unknown key', () => {
		expect(settings.get('nonexistent')).toBeUndefined();
	});
});
