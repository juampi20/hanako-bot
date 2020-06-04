const talkedRecently = new Set();
const { MessageEmbed } = require("discord.js");

module.exports = (client, message) => {
    // Ignora todos los bots
    if (message.author.bot) return;

    // SQLite Level System
    if (message.guild) {
        let score = client.getScore.get(message.author.id, message.guild.id);

        if (!score) {
            score = {
                id: `${message.guild.id}-${message.author.id}`,
                user: message.author.id,
                guild: message.guild.id,
                points: 0,
                level: 1
            }
        }

        if ((message.content.split(" ")).length > 1) {
            const addXP = Math.floor(Math.random() * 40) + 10;
            score.points += addXP;
        }

        const currentLevel = Math.floor(0.1 * Math.sqrt(score.points));

        if (score.level < currentLevel) {
            score.level++;
            const embed = new MessageEmbed()
                .setAuthor(
                    `Felicidades ${message.author.username}`,
                    message.author.avatarURL()
                )
                .setTitle('Has subido de nivel!')
                .setThumbnail("https://i.pinimg.com/originals/64/bf/d8/64bfd800da7d2e66bdba8530cc0d32ee.png")
                .setColor("RANDOM")
                .addField('Nuevo nivel', currentLevel);
            message.channel.send(embed).then(msg => {
                msg.delete({
                    timeout: 10000,
                });
            });
        }
        client.setScore.run(score);
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