const { MessageEmbed } = require("discord.js");
exports.run = (client, message, args) => {
    const embed = new MessageEmbed().setColor("RANDOM");
    const data = [];
    if (!args.length) {
        embed.setTitle("__**LISTA DE COMANDOS**__");
        const stuff = ["misc", "fun", "leveling", "nsfw"];
        stuff.forEach( category => {
            data.push(`\`\`\``);
            data.push(`== ${category.toUpperCase()} ==`);
            client.commands.forEach( command => {
                if (command.help.category === category) {
                    data.push(`• ${command.help.name} :: ${command.help.description}`);
                };
            });
            data.push(`\`\`\``);
        });
        embed.setFooter(`Use ${client.config.prefix}help <comando> para mas detalles.`)
    } else {
        client.commands.forEach( command => {
            if (command.help.name === args[0]) {
                embed.setTitle(`**Comando ${command.help.name} :**`);
                data.push(`**Descripcion:** ${command.help.description}`);
                data.push(`**Categoria:** ${command.help.category}`);
                data.push(`**Uso:** ${command.help.usage}`);
            };
        });
    };
    embed.setDescription(data);
    message.channel.send(embed).catch(err => client.looger.log(err, "error"));
};

exports.help = {
    name: "help",
    description: "Imprime todos los comandos o individualmente.",
    category: "misc",
    usage: "help <command>"
}