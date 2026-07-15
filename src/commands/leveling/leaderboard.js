const { EmbedBuilder, SlashCommandBuilder, InteractionContextType } = require("discord.js");

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

exports.data = new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Muestra el top 10 del servidor")
    .setContexts(InteractionContextType.Guild);

exports.execute = async (client, interaction) => {
    const top10 = client.levelingService.getLeaderboard(interaction.guild.id, 10);
    
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
    await interaction.reply({ embeds: [embed] });
};

exports.help = {
    name: "leaderboard",
    description: "Muestra el top 10 en nivel.",
    category: "leveling",
    usage: "leaderboard",
    hintSlash: "leaderboard"
};