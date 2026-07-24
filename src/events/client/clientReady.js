const { initialize } = require('../../database/connect');
const { loadModels, LevelService, Reward, Afk } = require('../../database/models');
const { registerSlashCommands } = require('../../handlers/loaders/commands');
const { initSessions } = require('./voiceStateUpdate');
const createLevelTable = require('../../database/migrations/createLevelTable');
const initializeContainer = require('../../container');

module.exports = async (client) => {
	try {
		client.logger?.debug?.('ClientReady: initializing database');
		const pool = await initialize();
		await loadModels(pool);
		await createLevelTable();
		await initializeContainer();
		client.levelingService = LevelService;
		client.rewardService = Reward;
		client.afkService = Afk;

		client.logger?.debug?.('ClientReady: database initialization successful');
	}
	catch (err) {
		client.logger.error('Startup failed: ', err);
		process.exit(1);
	}

	try {
		client.logger?.debug?.('ClientReady: registering slash commands');
		await registerSlashCommands(client);
		client.logger?.debug?.('ClientReady: slash commands registered');
	}
	catch (err) {
		client.logger.warn('Slash command registration failed: ' + (err?.message || err));
		client.logger?.debug?.(`ClientReady: slash command registration failed: ${err}`);
	}

	// Scan existing voice channels for users who joined before the bot started
	try {
		client.logger?.debug?.('ClientReady: initializing voice XP sessions');
		await initSessions(client);
		client.logger?.debug?.('ClientReady: voice XP sessions initialized');
		client.logger.log('Voice XP sessions initialized from existing channels.', 'log');
	}
	catch (err) {
		client.logger.warn('Voice initSessions failed: ' + (err?.message || err));
		client.logger?.debug?.(`ClientReady: voice XP initSessions failed: ${err}`);
	}

	client.logger.log(`${client.user.username} esta listo.`, 'ready');
	client.user.setActivity('Made with ❤');
};
