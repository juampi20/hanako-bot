'use strict';

const apiKeyMiddleware = require('./apiKeyMiddleware');

describe('API Key Middleware', () => {
	let req;
	let res;
	let next;

	beforeEach(() => {
		req = { path: '/api/levels/rank/123', get: jest.fn() };
		res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
		next = jest.fn();
	});

	test('passes request with valid API key', () => {
		req.get.mockImplementation((header) => {
			if (header === 'X-API-Key') return 'test-key';
			return undefined;
		});

		const middleware = apiKeyMiddleware({ apiKey: 'test-key' });
		middleware(req, res, next);

		expect(next).toHaveBeenCalled();
		expect(res.status).not.toHaveBeenCalled();
	});

	test('rejects request with invalid API key', () => {
		req.get.mockImplementation((header) => {
			if (header === 'X-API-Key') return 'wrong-key';
			return undefined;
		});

		const middleware = apiKeyMiddleware({ apiKey: 'test-key' });
		middleware(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({ success: false, error: { message: 'Invalid API key' } });
		expect(next).not.toHaveBeenCalled();
	});

	test('rejects request with missing API key', () => {
		req.get.mockReturnValue(undefined);

		const middleware = apiKeyMiddleware({ apiKey: 'test-key' });
		middleware(req, res, next);

		expect(res.status).toHaveBeenCalledWith(401);
		expect(res.json).toHaveBeenCalledWith({ success: false, error: { message: 'Invalid API key' } });
	});

	test('bypasses auth for health endpoint', () => {
		req.path = '/api/health';
		req.get.mockReturnValue(undefined);

		const middleware = apiKeyMiddleware({ apiKey: 'test-key' });
		middleware(req, res, next);

		expect(next).toHaveBeenCalled();
		expect(res.status).not.toHaveBeenCalled();
	});

	test('uses default public paths when none provided', () => {
		req.path = '/api/health';
		req.get.mockReturnValue(undefined);

		const middleware = apiKeyMiddleware({ apiKey: 'test-key' });
		middleware(req, res, next);

		expect(next).toHaveBeenCalled();
	});
});
