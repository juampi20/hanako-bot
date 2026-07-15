const { SlashCommandBuilder, InteractionContextType } = require("discord.js");
const { baseEmbed, COLORS } = require("../../utils/embed");

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
    
    const embed = baseEmbed(client, { color: COLORS.SUCCESS })
        .setThumbnail(target.displayAvatarURL())
        .setTitle(`🎁 Puntos otorgados`)
        .addFields(
            { name: "Usuario", value: `${target.tag}`, inline: true },
            { name: "Puntos otorgados", value: `${amount}`, inline: true },
            { name: "Puntos totales", value: `${result.target.points}`, inline: true }
        );
    
    await interaction.reply({ embeds: [embed] });
};

exports.help = {
    name: "give",
    description: "Dar xp a alguna persona.",
    category: "leveling",
    usage: "give <user> <xp>",
    ownerOnly: true,
    hintSlash: "give"
};