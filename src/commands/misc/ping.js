const { EmbedBuilder } = require("discord.js");

exports.run = async (client, message, _args) => {
    const embed = new EmbedBuilder().setColor(0x3498DB);
    message.channel.send({ embeds: [embed] }).then(msg =>{
        const ping = msg.createdTimestamp - message.createdTimestamp;
        embed.setTitle(`🏓 Pong!`)
        .setDescription(`**Latencia:** \`${ping}ms\``);
        msg.edit({ embeds: [embed] });
    }).catch(err => client.logger.log(err, "error"));
};

exports.help = {
    name: "ping",
    description: "Compueba la latencia del BOT con la API de discord.",
    category: "misc",
    usage: "ping"
};