module.exports = (client, message, command, next) => {
    try {
        next();
    } catch (err) {
        client.logger.log(err, "error");
        message.channel.send("Error: Ha ocurrido un error al ejecutar este comando.");
    }
};
