exports.run = async (client, message, args) => {
    const user = message.mentions.users.first();
    const amount = !!parseInt(args[0]) ? parseInt(args[0]) : parseInt(args[1])

    if (!amount) return message.reply('especifique una cantidad para eliminar!');
    if (!amount && !user) return message.reply('especifique un usuario y la cantidad, o solamente la cantidad, de mensajes a eliminar!');
    
    message.delete();
    message.channel.messages.fetch({
        limit: 100,
    }).then((messages) => {
        if (user) {
            const filterBy = user ? user.id : client.user.id;
            messages = messages.filter(m => m.author.id === filterBy).array().slice(0, amount);
        } else {
            messages = parseInt(amount);
        }
        message.channel.bulkDelete(messages).catch(error => console.log(error.stack));
    });
};

exports.help = {
    name: "purge",
    description: "Eliminar mensajes.",
    category: "moderation",
    usage: "purge <amount> or <user> <amount>"
};
