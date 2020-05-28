module.exports = (client) => {
    client.logger.log(`El Bot ${client.user.tag} esta listo.`, "ready");
    client.user.setActivity("Made with <3");
};