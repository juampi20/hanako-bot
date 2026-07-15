const { initialize } = require('../services/database');
const LevelingService = require('../services/leveling');

module.exports = (client) => {
    initialize('./data/scores.sqlite');
    client.levelingService = new LevelingService();
    
    client.logger.log(`${client.user.username} esta listo.`, "ready");
    client.user.setActivity("Made with ❤");
};
