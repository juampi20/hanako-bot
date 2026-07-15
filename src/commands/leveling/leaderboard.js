const { EmbedBuilder } = require("discord.js");

exports.run = (client, message, _args) => {
    const top10 = client.levelingService.getLeaderboard(message.guild.id, 10);
    
    const embed = new EmbedBuilder()
        .setTitle("Tabla de clasificación")
        .setAuthor({ name: client.user.username, iconURL: client.user.avatarURL() })
        .setDescription("Nuestros 10 principales líderes de puntos!")
        .setColor(0x9B59B6);
    
    for (const data of top10) {
        const user = client.users.cache.get(data.user);
        if (user) {
            embed.addFields({ name: user.username, value: `${data.points} puntos (nivel ${data.level})` });
        }
    }
    return message.channel.send({ embeds: [embed] });
};

exports.help = {
    name: "leaderboard",
    description: "Muestra el top 10 en nivel.",
    category: "leveling",
    usage: "leaderboard"
};