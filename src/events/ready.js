const { initialize } = require('../services/database');
const LevelingService = require('../services/leveling');
const { registerGuildCommands } = require('../services/registration');

module.exports = async (client) => {
    initialize('./data/scores.sqlite');
    client.levelingService = new LevelingService();
    
    await registerGuildCommands(client);
    
    client.logger.log(`${client.user.username} esta listo.`, "ready");
    client.user.setActivity("Made with ❤");
};
