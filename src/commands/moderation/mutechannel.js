exports.run = async (client, message, args) => {
    if (message.author.id !== client.config.ownerID) return message.reply("no tienes permiso para usar este comando!");


}

exports.help = {
    name: "mute",
    description: "Mute.",
    category: "moderation",
    usage: "mute "
};