const { MessageEmbed } = require("discord.js");
const client = require('nekos.life');
const { sfw, nsfw } = new client();

exports.run = async (client, message, args) => {
    const msg = await message.channel.send("Generando...");
    const embed = new MessageEmbed()
        .setColor("RANDOM")
        .setTitle(await sfw.catText().then(res => res.cat))
        .setImage(await sfw.meow().then(res => res.url));
    message.channel.send(embed);
    msg.delete();
};

exports.help = {
    name: "cat",
    description: "Cats!",
    category: "fun",
    usage: "cat"
};