module.exports = async (client, message, command, next) => {
    try {
        await next();
    } catch (err) {
        client.logger.log(err, "error");
        message.channel.send({ content: "Error: Ha ocurrido un error al ejecutar este comando." }).catch(() => {});
    }
};
