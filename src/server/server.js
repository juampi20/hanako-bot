'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const apiKeyMiddleware = require('./middleware/apiKeyMiddleware');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const { createRateLimiter } = require('./middleware/rateLimiter');
const { success, fail } = require('./middleware/response');
const guildIdMiddleware = require('./middleware/guildIdMiddleware');
const levelRoutes = require('./routes/levelRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const afkRoutes = require('./routes/afkRoutes');
const healthRoutes = require('./routes/healthRoutes');
const logger = require('../utils/logger');

/**
 * Create and configure Express application.
 *
 * @param {Object} config - Configuration options
 * @returns {Object} Configured Express application
 */
const createApp = (config = {}) => {
	const app = express();

	// Security headers
	app.use(helmet());

	// CORS configuration
	app.use(cors());

	// JSON body parser with limits
	app.use(express.json({ limit: '1mb' }));

	// Response helpers (attaches res.success / res.fail)
	app.use(success, fail);

	// API key authentication middleware (except health)
	app.use(apiKeyMiddleware({
		apiKey: config.apiKey || process.env.API_KEY,
		publicPaths: ['/api/health'],
	}));

	// Rate limiting
	app.use(createRateLimiter({
		windowMs: config.rateLimitWindowMs || 15 * 60 * 1000,
		max: config.rateLimitMax || 100,
		standardHeaders: true,
		legacyHeaders: false,
		message: { error: 'Too many requests, please try again later.' },
	}));

	// Routes
	app.use('/api', healthRoutes);
	app.use('/api/levels', guildIdMiddleware(config), levelRoutes);
	app.use('/api/rewards', guildIdMiddleware(config), rewardRoutes);
	app.use('/api/afk', guildIdMiddleware(config), afkRoutes);

	// 404 handler (must be before errorHandler)
	app.use(notFound);

	// Centralized error handling
	app.use(errorHandler);

	// Call config validation at startup
	if (typeof config.validate === 'function') {
		const validationErrors = config.validate();
		if (validationErrors && validationErrors.length > 0) {
			logger.error('Configuration validation failed:', validationErrors);
		}
	}

	return app;
};

/**
 * Start Express server and handle graceful shutdown.
 *
 * @param {Object} app - Express application
 * @param {Object} discordClient - Discord client instance (for shutdown)
 * @param {Object} config - Configuration options
 */
const startApi = (app, discordClient, config = {}) => {
	const port = config.apiPort || process.env.API_PORT || 3000;

	const server = app.listen(port, () => {
		logger.log(`API server running on port ${port}`, 'log');
	});

	// Graceful shutdown handler
	const gracefulShutdown = async () => {
		logger.log('Received SIGTERM, shutting down gracefully...', 'log');

		// Close Express server
		await new Promise((resolve, reject) => {
			server.close(err => {
				if (err) {
					logger.error('Error closing Express server:', err);
					reject(err);
				}
				else {
					logger.log('Express server closed successfully', 'log');
					resolve();
				}
			});
		});

		// Close Discord client connection
		if (discordClient && discordClient.destroy) {
			try {
				await discordClient.destroy();
				logger.log('Discord client closed successfully', 'log');
			}
			catch (err) {
				logger.error('Error closing Discord client:', err);
			}
			finally {
				process.exit(0);
			}
		}
		else {
			process.exit(0);
		}
	};

	process.on('SIGTERM', gracefulShutdown);
	process.on('SIGINT', gracefulShutdown);

	return server;
};

module.exports = {
	createApp,
	startApi,
};
