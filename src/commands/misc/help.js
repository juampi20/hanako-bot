const { SlashCommandBuilder, EmbedBuilder, InteractionContextType } = require("discord.js");
const { baseEmbed } = require("../../utils/embed");

exports.run = (client, message, args) => {
    const embed = new EmbedBuilder().setColor(0x3498DB);
    let data = [];
    if (!args.length) {
        embed.setTitle("**Hanako Commands**");
        const stuff = ["misc", "fun"];
        stuff.forEach(category => {
            client.commands.forEach(command => {
                if (command.help.category === category && command.data) {
                    data.push(`\`${command.help.name}\``);
                };
            });
            embed.addFields({ name: `${category.toUpperCase()}`, value: data.join(", "), inline: true });
            data = [];
        });
        embed.setDescription(`Use \`${client.config.prefix}help command\` para ver mas detalles acerca de un comando en particular.`)
    } else {
        client.commands.forEach(command => {
            if (command.help.name === args[0]) {
                const title = `**Informacion del comando:** \`${command.help.name}\``;
                data.push(`Categoria: \`${command.help.category}\``);
                data.push(`Uso: \`${client.config.prefix}\` \`${command.help.usage}\`\n`);
                data.push(`${command.help.description}`);
                embed.setTitle(title).setDescription(data.join('\n'));
            };
        });
    };
    message.channel.send({ embeds: [embed] }).catch(err => client.logger.log(err, "error"));
};

exports.data = new SlashCommandBuilder()
    .setName("help")
    .setDescription("Muestra todos los comandos disponibles")
    .addStringOption(opt => opt.setName("command").setDescription("Comando especifico").setRequired(false))
    .setContexts(InteractionContextType.Guild);

exports.execute = async (client, interaction) => {
    const commandName = interaction.options.getString("command");

    if (commandName) {
        const cmd = client.interactions.get(commandName);
        if (!cmd || !cmd.help) {
            return interaction.reply({ content: `No encontre el comando \`${commandName}\`.`, ephemeral: true });
        }
        const embed = baseEmbed(client)
            .setTitle(`**Informacion del comando:** \`${cmd.help.name}\``)
            .setDescription([
                `Categoria: \`${cmd.help.category}\``,
                `Uso: \`/${cmd.help.name}\`\n`,
                `${cmd.help.description}`
            ].join('\n'));
        return interaction.reply({ embeds: [embed] });
    }

    const embed = baseEmbed(client)
        .setTitle("**Hanako Commands**");
    let data = [];
    const categories = ["misc", "fun", "moderation", "leveling", "dev"];
    categories.forEach(category => {
        client.interactions.forEach(command => {
            if (command.help?.category === category && command.data) {
                data.push(`\`${command.help.name}\``);
            };
        });
        if (data.length > 0) {
            embed.addFields({ name: `${category.toUpperCase()}`, value: data.join(", "), inline: true });
            data = [];
        }
    });
    await interaction.reply({ embeds: [embed] });
};

exports.help = {
    name: "help",
    description: "Imprime todos los comandos o individualmente.",
    category: "misc",
    usage: "help <command>",
    hintSlash: "help"
}