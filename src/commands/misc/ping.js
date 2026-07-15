const { EmbedBuilder } = require("discord.js");

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

exports.help = {
    name: "ping",
    description: "Compueba la latencia del BOT con la API de discord.",
    category: "misc",
    usage: "ping"
};