const talkedRecently = new Set();

module.exports = (client, message) => {
    // Ignora todos los bots
    if(message.author.bot) return;

    // Devuelve el prefijo cuando el bot es mencionado, utiliza una expresion regular
    const prefixMention = new RegExp(`<@!?${client.user.id}>( |)$`);
    if (message.content.match(prefixMention)) {
        return message.reply(`Mi prefix es: \`${client.config.prefix}\``);
    }

    // Ignora los mensajes que no empiecen con el prefijo
    if (message.content.indexOf(client.config.prefix) !== 0) return;

    // Agrega un cooldown de 3 segundos para realizar otro comando
    if (talkedRecently.has(message.author.id)) return message.reply("tomate un tiempo.");

    talkedRecently.add(message.author.id);
    setTimeout(() => {
        talkedRecently.delete(message.author.id);
    }, 2500);

    // Estandar argumento/comando.
    const args = message.content.slice(client.config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    const cmd = client.commands.get(command);
    if (!cmd) return;

    client.logger.log(`${message.author.username} (${message.author.id}) ejecuto el comando ${cmd.help.name}`, "cmd");
    cmd.run(client, message, args);
}