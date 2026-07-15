exports.run = (client, message, _args) => {
    message.channel.send("Boop!");
};

exports.help = {
    name: "beep",
    description: "Boop!",
    category: "misc",
    usage: "beep"
};