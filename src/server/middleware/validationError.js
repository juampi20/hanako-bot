'use strict';

const { validationResult } = require('express-validator');

/**
 * Middleware that catches express-validator validation errors
 * and returns a standardized error response.
 */
const validationErrorHandler = (req, res, next) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
		return res.fail(400, 'Validation failed', errors.array());
	}
	next();
};

module.exports = validationErrorHandler;
