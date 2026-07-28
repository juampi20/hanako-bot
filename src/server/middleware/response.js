'use strict';

/**
 * Standardized API response helpers.
 * Attaches res.success() and res.fail() methods to the response object.
 */

const success = (req, res, next) => {
	res.success = (data, meta, statusCode = 200) => {
		const body = { success: true, data };
		if (meta) body.meta = meta;
		return res.status(statusCode).json(body);
	};
	next();
};

const fail = (req, res, next) => {
	res.fail = (statusCode, message, details) => {
		const body = {
			success: false,
			error: { message },
		};
		if (details) body.error.details = details;
		// Map common status codes to error codes
		const errorCodes = {
			400: 'VALIDATION_ERROR',
			401: 'UNAUTHORIZED',
			403: 'FORBIDDEN',
			404: 'NOT_FOUND',
			409: 'CONFLICT',
			429: 'RATE_LIMITED',
			500: 'INTERNAL_ERROR',
		};
		body.error.code = errorCodes[statusCode] || 'UNKNOWN_ERROR';
		return res.status(statusCode).json(body);
	};
	next();
};

module.exports = { success, fail };
