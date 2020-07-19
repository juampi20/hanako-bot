const { MessageEmbed } = require("discord.js");

String.prototype.toCamelCase = function (str) {
    return str
        .replace(/\s(.)/g, function ($1) { return $1.toUpperCase(); })
        .replace(/\s/g, '')
        .replace(/^(.)/, function ($1) { return $1.toLowerCase(); });
}

exports.run = (client, message, args) => {
    const embed = new MessageEmbed().setColor("BLUE");
    let data = [];
    if (!args.length) {
        embed.setTitle("**Hanako Commands**");
        const stuff = ["misc", "fun", "nsfw"];
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
                let title = `**Informacion del comando:** \`${client.config.prefix}${command.help.name}\``;
                data.push(`Categoria: \`${command.help.category}\``);
                data.push(`Uso: \`${client.config.prefix}${command.help.usage}\`\n`);
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