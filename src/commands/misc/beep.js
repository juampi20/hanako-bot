exports.run = (client, message, args) => {
    message.channel.send("Boop!");
};

exports.help = {
    name: "beep",
    description: "Boop!",
    category: "misc",
    usage: "beep"
};