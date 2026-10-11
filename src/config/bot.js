require('dotenv').config();

const settings = require('./settings');

/**
 * Validate the bot configuration.
 * @returns {string[]} Array of error messages, empty if valid
 */
function validate() {
	const errors = [];

	if (!process.env.CLIENT_TOKEN) {
		errors.push('CLIENT_TOKEN is required');
	}

	if (!process.env.GUILD_ID) {
		errors.push('GUILD_ID is required');
	}

	if (!process.env.API_KEY) {
		errors.push('API_KEY is required');
	}

	if (!process.env.API_PORT) {
		errors.push('API_PORT is required');
	}
	else if (isNaN(parseInt(process.env.API_PORT, 10))) {
		errors.push('API_PORT must be a number');
	}

	return errors;
}

const COLORS = {
	info: 0x3498DB,
	success: 0x57F287,
	error: 0xED4245,
	warning: 0xFEE75C,
	leveling: 0x9B59B6,
	fun: 0x5865F2,
};

const config = {
	token: process.env.CLIENT_TOKEN,
	ownerID: process.env.OWNER_ID,
	guildId: process.env.GUILD_ID,
	apiPort: parseInt(process.env.API_PORT, 10) || 3000,
	apiKey: process.env.API_KEY || null,
	colors: COLORS,
	...settings.defaults(),
};

module.exports = config;
module.exports.validate = validate;
