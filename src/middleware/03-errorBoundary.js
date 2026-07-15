module.exports = async (client, context, command, next) => {
    try {
        await next();
    } catch (err) {
        client.logger.log(err, "error");
        // Message context
        if (context.channel && context.channel.send) {
            context.channel.send({ content: "Error: Ha ocurrido un error al ejecutar este comando." }).catch(() => {});
        // Interaction context
        } else if (context.reply) {
            context.reply({ content: "Error: Ha ocurrido un error al ejecutar este comando.", ephemeral: true }).catch(() => {});
        }
    }
};
