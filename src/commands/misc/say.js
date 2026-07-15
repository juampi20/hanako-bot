exports.run = async (client, message, args) => {
    const sayMessage = args.join(" ");
    message.delete().catch(() => {});
    message.channel.send(sayMessage).catch(e => {
        client.logger.log(e, "error");
        message.channel.send("Error al ejecutar el comando").then(msg => {
            setTimeout(() => msg.delete(), 5000);
        });
    });
};

const { SlashCommandBuilder } = require("discord.js");

exports.data = new SlashCommandBuilder()
    .setName("say")
    .setDescription("Hace que el bot diga algo")
    .addStringOption(opt => opt.setName("message").setDescription("Mensaje a repetir").setRequired(true));

exports.execute = async (client, interaction) => {
    const message = interaction.options.getString("message");
    await interaction.reply(message);
};

exports.help = {
    name: "say",
    description: "Hanako-kun habla!",
    category: "misc",
    usage: "say <text>",
    hintSlash: "say"
};