const { EmbedBuilder } = require("discord.js");

exports.run = (client, message, _args) => {
    const score = client.levelingService.getScore(message.author.id, message.guild.id);
    const embed = new EmbedBuilder()
        .setAuthor({ name: message.author.username, iconURL: message.author.avatarURL() })
        .setColor(0x9B59B6)
        .addFields({ name: message.author.username, value: `${score.points} puntos (nivel ${score.level})` });
    return message.channel.send({ embeds: [embed] });
};

exports.help = {
    name: "rank",
    description: "Ver los puntos y nivel.",
    category: "leveling",
    usage: "rank"
};