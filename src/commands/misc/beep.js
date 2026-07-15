const { SlashCommandBuilder } = require("discord.js");

exports.run = (client, message, _args) => {
    message.channel.send("Boop!");
};

exports.data = new SlashCommandBuilder()
    .setName("beep")
    .setDescription("Boop!");

exports.execute = async (client, interaction) => {
    await interaction.reply("Boop!");
};

exports.help = {
    name: "beep",
    description: "Boop!",
    category: "misc",
    usage: "beep"
};