const { SlashCommandBuilder, InteractionContextType } = require("discord.js");
const { baseEmbed, COLORS } = require("../../utils/embed");

exports.run = (client, message, _args) => {
    const embed = baseEmbed(client, { color: COLORS.FUN }).setTitle("🔊 Beep!");
    message.channel.send({ embeds: [embed] });
};

exports.data = new SlashCommandBuilder()
    .setName("beep")
    .setDescription("Boop!")
    .setContexts(InteractionContextType.Guild);

exports.execute = async (client, interaction) => {
    const embed = baseEmbed(client, { color: COLORS.FUN }).setTitle("🔊 Beep!");
    await interaction.reply({ embeds: [embed] });
};

exports.help = {
    name: "beep",
    description: "Boop!",
    category: "misc",
    usage: "beep",
    hintSlash: "beep"
};;