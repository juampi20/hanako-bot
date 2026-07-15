module.exports = (client, message) => {
    if (message.author.bot) {return;}

    if (message.content.indexOf(client.config.prefix) !== 0) {return;}

    const args = message.content.slice(client.config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    const cmd = client.commands.get(command);
    if (!cmd) {return;}

    client.logger.log(`${message.author.username} (${message.author.id}) ejecuto el comando ${cmd.help.name}`, "cmd");

    let index = 0;
    const next = () => {
        const middleware = client.middleware[index++];
        if (!middleware) {
            cmd.run(client, message, args);
            return;
        }
        middleware(client, message, cmd, next);
    };
    next();
};
