const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

exports.run = async (client, message, _args) => {
    const embed = new EmbedBuilder()
        .setTitle("🏓 Pong!")
        .setDescription("Calculando...")
        .setColor(0x3498DB);
    const sent = await message.channel.send({ embeds: [embed] });
    const ping = sent.createdTimestamp - message.createdTimestamp;
    embed.setDescription(`**Latencia:** \`${ping}ms\``);
    sent.edit({ embeds: [embed] }).catch(err => client.logger.log(err, "error"));
};

exports.data = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Chequea la latencia del bot");

exports.execute = async (client, interaction) => {
    const embed = new EmbedBuilder()
        .setTitle("🏓 Pong!")
        .setDescription("Calculando...")
        .setColor(0x3498DB);
    const sent = await interaction.reply({ embeds: [embed], fetchReply: true });
    const ping = sent.createdTimestamp - interaction.createdTimestamp;
    embed.setDescription(`**Latencia:** \`${ping}ms\``);
    await interaction.editReply({ embeds: [embed] });
};

exports.help = {
    name: "ping",
    description: "Compueba la latencia del BOT con la API de discord.",
    category: "misc",
    usage: "ping",
    hintSlash: "ping"
};