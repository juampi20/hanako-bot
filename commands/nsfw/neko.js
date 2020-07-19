const { MessageEmbed } = require("discord.js");
const client = require('nekos.life');
const { nsfw } = new client();

exports.run = async (client, message, args) => {
    if (message.channel.nsfw) {
        const msg = await message.channel.send("Generando...");
        const embed = new MessageEmbed()
            .setColor("BLUE")
            .setTitle((await sfw.catText()).cat);

        embed.setImage((await nsfw.neko()).url);
        message.channel.send(embed);
        msg.delete();
    } else {
        message.channel.send(`El canal no es \`NSFW\``);
    }
};

exports.help = {
    name: "neko",
    description: "Imagen de Nekos.",
    category: "nsfw",
    usage: "neko"
};