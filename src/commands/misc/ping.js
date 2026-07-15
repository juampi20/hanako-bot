const { MessageEmbed } = require("discord.js");

exports.run = async (client, message, _args) => {
    const embed = new MessageEmbed().setColor("BLUE")
    message.channel.send(embed).then(msg =>{
        const ping = msg.createdTimestamp - message.createdTimestamp;
        embed.setTitle(`🏓 Pong!`)
        .setDescription(`**Latencia:** \`${ping}ms\``)
        msg.edit(embed);
    }).catch(err => client.logger.log(err, "error"));
};

exports.help = {
    name: "ping",
    description: "Compueba la latencia del BOT con la API de discord.",
    category: "misc",
    usage: "ping"
};