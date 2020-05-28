const { MessageEmbed } = require("discord.js");
const client = require('nekos.life');
const { sfw } = new client();

exports.run = async (client, message, args) => {
    const text = args.join(" ");
    if (!text) return message.reply("tenes que pasarle una pregunta!");
    const embed = new MessageEmbed()
        .setColor("RANDOM")
        .setImage((await sfw["8Ball"]({ text: text })).url);
    message.channel.send(embed);
};

exports.help = {
    name: "8ball",
    description: "8ball te respondera la pregunta!",
    category: "fun",
    usage: "8ball <text>"
};