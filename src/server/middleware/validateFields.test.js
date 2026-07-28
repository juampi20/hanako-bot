'use strict';

const { requireFields } = require('./validateFields');

describe('requireFields', () => {
	test('returns empty array when all fields are present', () => {
		const body = { userId: '123', reason: 'test' };
		const missing = requireFields(body, ['userId', 'reason']);
		expect(missing).toEqual([]);
	});

	test('returns missing field names', () => {
		const body = { userId: '123' };
		const missing = requireFields(body, ['userId', 'reason']);
		expect(missing).toEqual(['reason']);
	});

	test('handles null values as missing', () => {
		const body = { userId: null, reason: 'test' };
		const missing = requireFields(body, ['userId']);
		expect(missing).toEqual(['userId']);
	});

	test('handles empty string values as missing', () => {
		const body = { userId: '', reason: 'test' };
		const missing = requireFields(body, ['userId']);
		expect(missing).toEqual(['userId']);
	});

	test('returns all fields when body is empty', () => {
		const body = {};
		const missing = requireFields(body, ['userId', 'reason', 'level']);
		expect(missing).toEqual(['userId', 'reason', 'level']);
	});
});
