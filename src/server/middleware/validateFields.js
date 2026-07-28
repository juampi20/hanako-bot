'use strict';

/**
 * Check that required fields exist in the given object.
 *
 * @param {Object} body - The request body or object to validate
 * @param {string[]} fields - Array of required field names
 * @returns {string[]} Array of missing field names (empty if all present)
 */
function requireFields(body, fields) {
	const missing = [];

	for (const field of fields) {
		if (body[field] === undefined || body[field] === null || body[field] === '') {
			missing.push(field);
		}
	}

	return missing;
}

module.exports = { requireFields };
