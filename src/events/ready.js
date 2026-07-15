const { initialize } = require('../services/database');
const LevelingService = require('../services/leveling');

module.exports = (client) => {
    initialize('./scores.sqlite');
    client.levelingService = new LevelingService();
    
    client.logger.log(`${client.user.tag} esta listo.`, "ready");
    client.user.setActivity("Made with ❤");
};
