exports.run = async (client, message, args) => {
    const eightball = [

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
    if (!question.endsWith("?")) {return message.reply("Umm... ¿cual es la pregunta?");}
    await message.channel.send(eightball[Math.floor(Math.random() * eightball.length)]);
};

const { SlashCommandBuilder } = require("discord.js");

exports.data = new SlashCommandBuilder()
    .setName("8ball")
    .setDescription("Preguntale algo a la bola magica")
    .addStringOption(opt => opt.setName("question").setDescription("Tu pregunta").setRequired(true));

exports.execute = async (client, interaction) => {
    const eightball = [
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
    const question = interaction.options.getString("question");
    if (!question.endsWith("?")) {
        return interaction.reply("Umm... ¿cual es la pregunta?");
    }
    await interaction.reply(eightball[Math.floor(Math.random() * eightball.length)]);
};

exports.help = {
    name: "8ball",
    description: "Para la fortuna o buscar consejo.",
    category: "fun",
    usage: "8ball <question>",
    hintSlash: "8ball"
};