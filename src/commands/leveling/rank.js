const { MessageEmbed } = require("discord.js");

exports.run = (client, message, args) => {
    let score = client.getScore.get(message.author.id, message.guild.id);
    const embed = new MessageEmbed()
        .setAuthor(message.author.username, message.author.avatarURL())
        .setColor("RANDOM")
        .addFields({ name: message.author.tag, value: `${score.points} puntos (nivel ${score.level})` });
    return message.channel.send({ embed });
};

exports.help = {
    name: "rank",
    description: "Ver los puntos y nivel.",
    category: "leveling",
    usage: "rank"
};