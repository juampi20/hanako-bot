'use strict';

/**
 * Catch-all 404 middleware.
 * Returns structured JSON for unmatched routes.
 */
module.exports = (req, res) => {
	if (typeof res.fail === 'function') {
		return res.fail(404, 'Route not found');
	}
	res.status(404).json({ success: false, error: { message: 'Route not found' } });
};
