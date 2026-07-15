const { SlashCommandBuilder, PermissionFlagsBits, InteractionContextType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

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
    const user = interaction.options.getUser("user");
    const amount = interaction.options.getInteger("amount");
    const targetDesc = user ? ` de **${user.tag}**` : "";
    const countLabel = `${amount} mensaje${amount !== 1 ? "s" : ""}`;

    const confirm = new ButtonBuilder()
        .setCustomId("purge_confirm")
        .setLabel("Confirmar")
        .setStyle(ButtonStyle.Danger);

    const cancel = new ButtonBuilder()
        .setCustomId("purge_cancel")
        .setLabel("Cancelar")
        .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(cancel, confirm);

    const response = await interaction.reply({
        content: `¿Eliminar ${countLabel}${targetDesc}?`,
        components: [row],
        ephemeral: true,
        withResponse: true,
    });

    let confirmed = false;
    try {
        const confirmation = await response.resource.message.awaitMessageComponent({
            filter: i => i.user.id === interaction.user.id,
            time: 30_000,
        });

        if (confirmation.customId === "purge_confirm") {
            confirmed = true;
            await confirmation.update({ content: "Eliminando mensajes...", components: [] });
        } else {
            await confirmation.update({ content: "Operación cancelada.", components: [] });
            return;
        }
    } catch {
        await interaction.editReply({ content: "Tiempo de espera agotado. Operación cancelada.", components: [] });
        return;
    }

    if (!confirmed) return;

    await interaction.editReply({ content: "Eliminando mensajes...", components: [] });
    const fetched = await interaction.channel.messages.fetch({ limit: 100 });
    let toDelete;
    if (user) {
        const filterBy = user.id;
        toDelete = Array.from(fetched.filter(m => m.author.id === filterBy).values()).slice(0, amount);
    } else {
        toDelete = amount;
    }
    await interaction.channel.bulkDelete(toDelete);
    const deletedCount = typeof toDelete === "number" ? toDelete : toDelete.length;
    await interaction.editReply({
        content: `✅ Eliminados ${deletedCount} mensaje${deletedCount !== 1 ? "s" : ""}${targetDesc}.`,
        components: [],
    });
};

exports.help = {
    name: "purge",
    description: "Eliminar mensajes.",
    category: "moderation",
    usage: "purge <amount> or <user> <amount>",
    ownerOnly: true,
    hintSlash: "purge"
};
