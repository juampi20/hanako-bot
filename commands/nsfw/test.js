const { MessageEmbed } = require("discord.js");
const client = require('nekos.life');
const { sfw, nsfw } = new client();

exports.run = async (client, message, args) => {
    const nsfwChannel = message.channel.nsfw ? "nsfw" : "sfw";
    const msg = await message.channel.send("Generando...");
    const embed = new MessageEmbed()
        .setColor("RANDOM");
        // .setTitle((await sfw.catText()).cat);
    if (nsfwChannel === "nsfw") {
        embed.setImage((await nsfw.pussyArt()).url);
    } else {
        msg.delete();
        return message.channel.send("El canal no es \`NSFW\`.");
    }
    message.channel.send(embed);
    msg.delete();
};

exports.help = {
    name: "test",
    description: "test!",
    category: "nsfw",
    usage: "test"
};