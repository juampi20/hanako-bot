const { MessageEmbed } = require("discord.js");
const client = require('nekos.life');
const { sfw, nsfw } = new client();

exports.run = async (client, message, args) => {
    const nsfwChannel = message.channel.nsfw ? "nsfw" : "sfw";

    const msg = await message.channel.send("Generando...");

    const functionArray = [
        nsfw.randomHentaiGif(),
        nsfw.pussy(),
        nsfw.lesbian(),
        nsfw.kuni(),
        nsfw.cumsluts(),
        nsfw.classic(),
        nsfw.boobs(),
        nsfw.bJ(),
        nsfw.anal(),
        nsfw.yuri(),
        nsfw.tits(),
        nsfw.girlSoloGif(),
        nsfw.girlSolo(),
        nsfw.pussyWankGif(),
        nsfw.pussyArt(),
        nsfw.kemonomimi(),
        nsfw.kitsune(),
        nsfw.keta(),
        nsfw.holo(),
        nsfw.holoEro(),
        nsfw.hentai(),
        nsfw.feetGif(),
        nsfw.eroFeet(),
        nsfw.feet(),
        nsfw.ero(),
        nsfw.eroKitsune(),
        nsfw.eroKemonomimi(),
        nsfw.eroNeko(),
        nsfw.eroYuri(),
        nsfw.cumArts(),
        nsfw.blowJob()
    ];

    const embed = new MessageEmbed()
        .setColor("RANDOM")
        .setTitle((await sfw.catText()).cat);

    if (nsfwChannel === "nsfw") {
        embed.setImage((await (functionArray[Math.floor(Math.random() * functionArray.length)])).url);
    } else {
        msg.delete();
        return message.channel.send("El canal no es \`NSFW\`.");
    }

    message.channel.send(embed);
    msg.delete();
};

exports.help = {
    name: "hentai",
    description: "Imagen/Gif de Hentai.",
    category: "nsfw",
    usage: "hentai"
};