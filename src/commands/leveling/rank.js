const { EmbedBuilder, SlashCommandBuilder, InteractionContextType } = require("discord.js");

exports.run = (client, message, _args) => {
    const score = client.levelingService.getScore(message.author.id, message.guild.id);
    const embed = new EmbedBuilder()
        .setAuthor({ name: message.author.username, iconURL: message.author.avatarURL() })
        .setColor(0x9B59B6)
        .addFields({ name: message.author.username, value: `${score.points} puntos (nivel ${score.level})` });
    return message.channel.send({ embeds: [embed] });
};

exports.data = new SlashCommandBuilder()
    .setName("rank")
    .setDescription("Muestra tu nivel y XP")
    .addUserOption(opt => opt.setName("user").setDescription("Usuario a consultar").setRequired(false))
    .setContexts(InteractionContextType.Guild);

exports.execute = async (client, interaction) => {
    const target = interaction.options.getUser("user") || interaction.user;
    const score = client.levelingService.getScore(target.id, interaction.guild.id);
    const embed = new EmbedBuilder()
        .setAuthor({ name: target.username, iconURL: target.avatarURL() })
        .setColor(0x9B59B6)
        .addFields({ name: target.username, value: `${score.points} puntos (nivel ${score.level})` });
    await interaction.reply({ embeds: [embed] });
};

exports.help = {
    name: "rank",
    description: "Ver los puntos y nivel.",
    category: "leveling",
    usage: "rank",
    hintSlash: "rank"
};