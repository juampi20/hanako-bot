const errorBoundary = async (client, context, command, next) => {
	try {
		await next();
	}
	catch (err) {
		client.logger.log(err, 'error');
		// Message context
		if (context.channel && context.channel.send) {
			context.channel.send({ content: 'Error: Ha ocurrido un error al ejecutar este comando.' }).catch(() => {
				/* silently fail */
			});
			// Interaction context
		}
		else if (context.reply) {
			context.reply({ content: 'Error: Ha ocurrido un error al ejecutar este comando.', ephemeral: true }).catch(() => {
				/* silently fail */
			});
		}
	}
};

errorBoundary.priority = 30;
module.exports = errorBoundary;
