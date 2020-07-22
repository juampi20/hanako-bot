const { MessageEmbed } = require("discord.js");

exports.run = (client, message, args) => {
    const top10 = client.sql.prepare("SELECT * FROM scores WHERE guild = ? ORDER BY points DESC LIMIT 10;").all(message.guild.id);

    const embed = new MessageEmbed()
        .setTitle("Tabla de clasificación")
        .setAuthor(client.user.username, client.user.avatarURL())
        .setDescription("Nuestros 10 principales líderes de puntos!")
        .setColor("RANDOM");

    for (const data of top10) {
        embed.addFields({ name: client.users.cache.get(data.user).tag, value: `${data.points} puntos (nivel ${data.level})` });
    }
    return message.channel.send({ embed });
};

exports.help = {
    name: "leaderboard",
    description: "Muestra el top 10 en nivel.",
    category: "leveling",
    usage: "leaderboard"
};