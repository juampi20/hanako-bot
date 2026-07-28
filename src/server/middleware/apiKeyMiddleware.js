'use strict';

const crypto = require('crypto');

/**
 * API key authentication middleware factory.
 *
 * @param {Object} options - Middleware options
 * @param {string} [options.apiKey] - Expected API key value
 * @param {string[]} [options.publicPaths=['/api/health']] - Paths that bypass auth
 * @returns {import('express').RequestHandler} Express middleware
 */
module.exports = (options = {}) => {
	const expectedKey = options.apiKey;
	const publicPaths = options.publicPaths || ['/api/health'];

	return (req, res, next) => {
		// No API key configured on server — auth is disabled
		if (!expectedKey) {
			return next();
		}

		// Allow public paths without authentication
		if (publicPaths.includes(req.path)) {
			return next();
		}

		const providedKey = req.get('X-API-Key');

		if (!providedKey) {
			return res.fail ? res.fail(401, 'Invalid API key') : res.status(401).json({ success: false, error: { message: 'Invalid API key' } });
		}

		// Use constant-time comparison to prevent timing attacks
		const providedBuffer = Buffer.from(providedKey);
		const expectedBuffer = Buffer.from(expectedKey);

		if (providedBuffer.length !== expectedBuffer.length) {
			return res.fail ? res.fail(401, 'Invalid API key') : res.status(401).json({ success: false, error: { message: 'Invalid API key' } });
		}

		if (!crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
			return res.fail ? res.fail(401, 'Invalid API key') : res.status(401).json({ success: false, error: { message: 'Invalid API key' } });
		}

		next();
	};
};
