exports.run = (client, message, args) => {
    if (message.author.id !== client.config.ownerID) return;
    const user = message.mentions.users.first();
    if (!user) return message.reply("debes mencionar alguna persona.");

    const addXP = parseInt(args[1], 10);
    if (!addXP) return message.reply("debes decirme cuanto xp dar ...");

    const result = client.levelingService.givePoints(message.author.id, user.id, message.guild.id, addXP);
    if (!result) return message.reply("No puedes dar tantos puntos.");
    
    return message.channel.send(`${user.tag} ha recibido ${addXP} puntos y ahora tiene ${result.target.points} puntos.`);
};
exports.help = {
    name: "give",
    description: "Dar xp a alguna persona.",
    category: "leveling",
    usage: "give <user> <xp>"
};