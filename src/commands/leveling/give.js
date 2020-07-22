exports.run = (client, message, args) => {
    if (message.author.id !== client.config.ownerID) return;
    const user = message.mentions.users.first();
    if (!user) return message.reply("debes mencionar alguna persona.");

    const addXP = parseInt(args[1], 10);
    if (!addXP) return message.reply("debes decirme cuanto xp dar ...");

    let userscore = client.getScore.get(user.id, message.guild.id);
    if (!userscore) {
        userscore = { id: `${message.guild.id}-${user.id}`, user: user.id, guild: message.guild.id, points: 0, level: 1 }
    }
    userscore.points += addXP;

    let userLevel = Math.floor(0.1 * Math.sqrt(userscore.points));
    userscore.level = userLevel;

    client.setScore.run(userscore);
    return message.channel.send(`${user.tag} ha recibido ${addXP} puntos y ahora tiene ${userscore.points} puntos.`);
};

exports.help = {
    name: "give",
    description: "Dar xp a alguna persona.",
    category: "leveling",
    usage: "give <user> <xp>"
};