'use strict';

const logger = require('../../utils/logger');
const AppError = require('../errors/AppError');

/**
 * Centralized Express error handler.
 * Catches all errors and returns consistent JSON error responses.
 *
 * @param {Error} err - The error object
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {import('express').NextFunction} next - Express next function
 */
module.exports = (err, req, res, next) => {
	const isProduction = process.env.NODE_ENV === 'production';
	const isOperational = err instanceof AppError;

	// Log full error server-side (including stack)
	logger.error(`API Error: ${err.message}\n${err.stack}`);

	// Determine HTTP status code
	const statusCode = err.statusCode || err.status || 500;

	// Check if headers have already been sent
	if (res.headersSent) {
		return next(err);
	}

	// Use res.fail() envelope if available, fall back to direct JSON
	if (typeof res.fail === 'function') {
		if (isOperational) {
			return res.fail(statusCode, err.message);
		}

		// Non-operational: hide details in production
		const message = isProduction ? 'Internal server error' : err.message;
		return res.fail(statusCode, message);
	}

	// Fallback if res.fail is not available
	const body = { success: false, error: { message: err.message } };
	return res.status(statusCode).json(body);
};
