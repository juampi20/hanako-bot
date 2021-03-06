const { MessageEmbed } = require("discord.js");

exports.run = (client, message, args) => {
    const embed = new MessageEmbed().setColor("BLUE");
    let data = [];
    if (!args.length) {
        embed.setTitle("**Hanako Commands**");
        const stuff = ["misc", "fun"];
        stuff.forEach(category => {
            client.commands.forEach(command => {
                if (command.help.category === category) {
                    data.push(`\`${command.help.name}\``);
                };
            });
            embed.addField(`${category.toUpperCase()}`, data.join(", "), true);
            data = [];
        });
        embed.setDescription(`Use \`${client.config.prefix}help command\` para ver mas detalles acerca de un comando en particular.`)
    } else {
        client.commands.forEach(command => {
            if (command.help.name === args[0]) {
                let title = `**Informacion del comando:** \`${command.help.name}\``;
                data.push(`Categoria: \`${command.help.category}\``);
                data.push(`Uso: \`${client.config.prefix}\` \`${command.help.usage}\`\n`);
                data.push(`${command.help.description}`);
                embed.setTitle(title).setDescription(data);
            };
        });
    };
    message.channel.send(embed).catch(err => client.looger.log(err, "error"));
};

exports.help = {
    name: "help",
    description: "Imprime todos los comandos o individualmente.",
    category: "misc",
    usage: "help <command>"
}