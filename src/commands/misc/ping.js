const { EmbedBuilder, SlashCommandBuilder, InteractionContextType } = require("discord.js");
const { baseEmbed } = require("../../utils/embed");

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
    .setDescription("Chequea la latencia del bot")
    .setContexts(InteractionContextType.Guild);

exports.execute = async (client, interaction) => {
    const embed = baseEmbed(client)
        .setTitle("🏓 Pong!")
        .setDescription("Calculando...");
    const sent = await interaction.reply({ embeds: [embed], fetchReply: true });
    const ping = sent.createdTimestamp - interaction.createdTimestamp;
    embed.setDescription(`**Latencia:** \`${ping}ms\`\n**Ping WebSocket:** \`${client.ws.ping}ms\``);
    await interaction.editReply({ embeds: [embed] });
};

exports.help = {
    name: "ping",
    description: "Compueba la latencia del BOT con la API de discord.",
    category: "misc",
    usage: "ping",
    hintSlash: "ping"
};