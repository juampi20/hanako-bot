'use strict';

const AppError = require('./AppError');

describe('AppError', () => {
	it('should create an operational error with status code', () => {
		const err = new AppError('Test error', 400);

		expect(err).toBeInstanceOf(Error);
		expect(err).toBeInstanceOf(AppError);
		expect(err.message).toBe('Test error');
		expect(err.statusCode).toBe(400);
		expect(err.isOperational).toBe(true);
		expect(err.status).toBe('fail');
	});

	it('should create an operational error for server error', () => {
		const err = new AppError('Server error', 500);

		expect(err.status).toBe('error');
	});
});
