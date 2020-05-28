module.exports = (client, message) => {
    // Ignora todos los bots
    if(message.author.bot) return;
    // Ignora los mensajes que no empiecen con el prefijo
    if (message.content.indexOf(client.config.prefix) !== 0) return;

    // Estandar argumento/comando.
    const args = message.content.slice(client.config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    const cmd = client.commands.get(command);
    if (!cmd) return;

    client.logger.log(`${message.author.username} (${message.author.id}) ejecuto el comando ${cmd.help.name}`, "cmd");
    cmd.run(client, message, args);
}