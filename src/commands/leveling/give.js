const { SlashCommandBuilder, InteractionContextType } = require("discord.js");

exports.data = new SlashCommandBuilder()
    .setName("give")
    .setDescription("Da puntos a otro usuario")
    .addUserOption(opt => opt.setName("user").setDescription("Usuario a dar puntos").setRequired(true))
    .addIntegerOption(opt => opt.setName("amount").setDescription("Cantidad de puntos").setRequired(true).setMinValue(1))
    .setContexts(InteractionContextType.Guild);

exports.execute = async (client, interaction) => {
    const target = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    const result = client.levelingService.givePoints(interaction.user.id, target.id, interaction.guild.id, amount);
    if (!result) {
        return interaction.reply({ content: "No puedes dar tantos puntos.", ephemeral: true });
    }
    
    await interaction.reply(`${target.tag} ha recibido ${amount} puntos y ahora tiene ${result.target.points} puntos.`);
};

exports.help = {
    name: "give",
    description: "Dar xp a alguna persona.",
    category: "leveling",
    usage: "give <user> <xp>",
    ownerOnly: true,
    hintSlash: "give"
};