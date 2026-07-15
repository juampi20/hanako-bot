const { SlashCommandBuilder, InteractionContextType } = require("discord.js");
const { baseEmbed } = require("../../utils/embed");

exports.run = (client, message, _args) => {
    message.channel.send("Boop!");
};

exports.data = new SlashCommandBuilder()
    .setName("beep")
    .setDescription("Boop!")
    .setContexts(InteractionContextType.Guild);

exports.execute = async (client, interaction) => {
    const embed = baseEmbed(client).setDescription("🤖");
    await interaction.reply({ embeds: [embed] });
};

exports.help = {
    name: "beep",
    description: "Boop!",
    category: "misc",
    usage: "beep",
    hintSlash: "beep"
};;