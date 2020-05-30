const { MessageEmbed } = require("discord.js");
const client = require('nekos.life');
const { sfw } = new client();

exports.run = async (client, message, args) => {
    var eightball = [

        "Si.",
        "En mi opinión, sí.",
        "Es cierto.",
        "Probablemente.",
        "Sin duda.",
        "Definitivamente.",

        "Tal vez.",
        "Puede ser.",
        "Tendrás que esperar.",
        "Tengo mis dudas.",
        "¿Quién sabe?",
        "No puedo predecirlo ahora.",

        "No.",
        "No apuestes por eso.",
        "Olvídalo.",
        "Mis fuentes dicen que no.",
        "Definitivamente no.",
        "No lo creo.",
    ];
    const question = args.join(" ");
    if (!question.endsWith("?")) return message.reply("Umm... ¿cual es la pregunta?");
    message.channel.send(eightball[Math.floor(Math.random() * eightball.length)]);
};

exports.help = {
    name: "8ball",
    description: "Para la fortuna o buscar consejo.",
    category: "fun",
    usage: "8ball <question>"
};