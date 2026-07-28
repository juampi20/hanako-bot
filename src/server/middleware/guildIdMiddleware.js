'use strict';

/**
 * Middleware that extracts guildId from configuration
 * and attaches it to req.guildId.
 *
 * @param {Object} config - Application configuration object
 * @returns {import('express').RequestHandler}
 */
const guildId = (config) => {
	const guildIdValue = config?.guildId || process.env.GUILD_ID;

	return (req, res, next) => {
		req.guildId = guildIdValue;
		next();
	};
};

module.exports = guildId;
