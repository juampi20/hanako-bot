module.exports = (client) => {
    client.logger.log(`${client.user.tag} esta listo.`, "ready");
    client.user.setActivity("Made with ❤");
};