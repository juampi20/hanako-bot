const { initialize } = require('../../database/connect');
const { loadModels, Score, Reward } = require('../../database/models');
const { registerSlashCommands } = require('../../handlers/loaders/commands');

module.exports = async (client) => {
    try {
        const db = initialize('./data/scores.sqlite');
        loadModels(db);
        client.levelingService = Score;
        client.rewardService = Reward;
    } catch (err) {
        client.logger.error('Startup failed: ', err);
        process.exit(1);
    }

    try {
        await registerSlashCommands(client);
    } catch (err) {
        client.logger.warn('Slash command registration failed: ' + (err?.message || err));
    }

    client.logger.log(`${client.user.username} esta listo.`, "ready");
    client.user.setActivity("Made with ❤");
};
