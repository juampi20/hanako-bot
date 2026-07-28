'use strict';

/**
 * Custom operational error class for the API.
 * Distinguishes known operational errors from unexpected crashes.
 */
class AppError extends Error {
	/**
	 * @param {string} message - Human-readable error description
	 * @param {number} statusCode - HTTP status code (4xx or 5xx)
	 */
	constructor(message, statusCode) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = true;
		this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

		Error.captureStackTrace(this, this.constructor);
	}
}

module.exports = AppError;
