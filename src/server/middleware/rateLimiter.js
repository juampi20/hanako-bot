'use strict';

const rateLimit = require('express-rate-limit');

/**
 * Create rate limiter middleware with configurable settings.
 * @param {Object} config - Configuration
 * @param {number} [config.windowMs=900000] - Window in ms (default 15 min)
 * @param {number} [config.max=100] - Max requests per window
 * @returns {import('express').RequestHandler}
 */
const createRateLimiter = (config = {}) => {
	return rateLimit({
		windowMs: config.windowMs || 15 * 60 * 1000,
		max: config.max || 100,
		standardHeaders: true,
		legacyHeaders: false,
		message: { success: false, error: { message: 'Too many requests, please try again later.', code: 'RATE_LIMITED' } },
	});
};

module.exports = { createRateLimiter };
