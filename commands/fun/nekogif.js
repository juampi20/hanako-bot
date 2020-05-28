const { MessageEmbed } = require("discord.js");
const client = require('nekos.life');
const { sfw, nsfw } = new client();

exports.run = async (client, message, args) => {
    const nsfwChannel = message.channel.nsfw ? "nsfw" : "sfw";
    const msg = await message.channel.send("Generando...");
    const embed = new MessageEmbed()
        .setColor("RANDOM")
        .setTitle(await sfw.catText().then(res => res.cat));
    if (nsfwChannel === "nsfw") {
        embed.setImage(await nsfw.nekoGif().then(res => res.url));
    } else {
        embed.setImage(await sfw.nekoGif().then(res => res.url));
    }
    message.channel.send(embed);
    msg.delete();
};

exports.help = {
    name: "nekoGif",
    description: "NekosGifs!",
    category: "fun",
    usage: "nekoGif"
};