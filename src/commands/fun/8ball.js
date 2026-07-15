const { SlashCommandBuilder, InteractionContextType } = require("discord.js");
const { baseEmbed, COLORS } = require("../../utils/embed");

// Extract 8ball responses to module-level constant
const EIGHTBALL_ANSWERS = [
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
    "No lo creo."
];

exports.run = async (client, message, args) => {
    const question = args.join(" ");
    if (!question.endsWith("?")) {return message.reply("Umm... ¿cual es la pregunta?");}
    const answer = EIGHTBALL_ANSWERS[Math.floor(Math.random() * EIGHTBALL_ANSWERS.length)];
    const embed = baseEmbed(client, { color: COLORS.FUN })
        .setTitle("🔮 8Ball")
        .setDescription(`**Pregunta:** ${question}\n\n**Respuesta:** ${answer}`);
    await message.channel.send({ embeds: [embed] });
};

exports.data = new SlashCommandBuilder()
    .setName("8ball")
    .setDescription("Preguntale algo a la bola magica")
    .addStringOption(opt => opt.setName("question").setDescription("Tu pregunta").setRequired(true))
    .setContexts(InteractionContextType.Guild);

exports.execute = async (client, interaction) => {
    const question = interaction.options.getString("question");
    if (!question.endsWith("?")) {
        return interaction.reply("Umm... ¿cual es la pregunta?");
    }
    const answer = EIGHTBALL_ANSWERS[Math.floor(Math.random() * EIGHTBALL_ANSWERS.length)];
    const embed = baseEmbed(client, { color: COLORS.FUN })
        .setTitle("🔮 8Ball")
        .setDescription(`**Pregunta:** ${question}\n\n**Respuesta:** ${answer}`);
    await interaction.reply({ embeds: [embed] });
};

exports.help = {
    name: "8ball",
    description: "Para la fortuna o buscar consejo.",
    category: "fun",
    usage: "8ball <question>",
    hintSlash: "8ball"
};