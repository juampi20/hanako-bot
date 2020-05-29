const { MessageEmbed } = require("discord.js");
const client = require('nekos.life');
const { sfw } = new client();

exports.run = async (client, message, args) => {
    var eightball = [ // sets the answers to an eightball
        "si!",
        "no...",
        "tal vez?",
        "probablemente",
        "no lo creo.",
        "nunca!",
        "podes intentarlo...",
        "depende de usted!",
    ];
    const question = args.join(" ");
    if (!question.endsWith("?")) return message.reply("Umm... ¿cual es la pregunta?");
    message.reply(eightball[Math.floor(Math.random() * eightball.length)]);
};

exports.help = {
    name: "8ball",
    description: "8ball te respondera la pregunta!",
    category: "fun",
    usage: "8ball <question>"
};