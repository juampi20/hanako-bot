const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType } = require("discord.js");

exports.run = async (client, message, args) => {
    const user = message.mentions.users.first();
    const amount = parseInt(args[0]) ? parseInt(args[0]) : parseInt(args[1])

    if (!amount) {return message.reply('especifique una cantidad para eliminar!');}
    if (!amount && !user) {return message.reply('especifique un usuario y la cantidad, o solamente la cantidad, de mensajes a eliminar!');}

    message.delete().catch(() => {});
    const fetched = await message.channel.messages.fetch({ limit: 100 });
    let toDelete;
    if (user) {
        const filterBy = user.id;
        toDelete = Array.from(fetched.filter(m => m.author.id === filterBy).values()).slice(0, amount);
    } else {
        toDelete = amount;
    }
    message.channel.bulkDelete(toDelete).catch(err => client.logger.log(err, "error"));
};

exports.data = new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Elimina mensajes del canal")
    .addIntegerOption(opt => opt.setName("amount").setDescription("Cantidad de mensajes").setRequired(true).setMinValue(1).setMaxValue(100))
    .addUserOption(opt => opt.setName("user").setDescription("Usuario cuyos mensajes eliminar").setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setContexts(InteractionContextType.Guild);

exports.execute = async (client, interaction) => {
    await interaction.deferReply({ ephemeral: true });
    const user = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");

    const fetched = await interaction.channel.messages.fetch({ limit: 100 });
    let toDelete;
    if (user) {
        const filterBy = user.id;
        toDelete = Array.from(fetched.filter(m => m.author.id === filterBy).values()).slice(0, amount);
    } else {
        toDelete = amount;
    }
    await interaction.channel.bulkDelete(toDelete);
    await interaction.editReply({ content: `Eliminados ${typeof toDelete === 'number' ? toDelete : toDelete.length} mensajes.` });
};

exports.help = {
    name: "purge",
    description: "Eliminar mensajes.",
    category: "moderation",
    usage: "purge <amount> or <user> <amount>",
    ownerOnly: true,
    hintSlash: "purge"
};
