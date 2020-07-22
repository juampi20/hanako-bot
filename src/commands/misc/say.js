exports.run = async (client, message, args) => {
    let sayMessage = args.join(" ");
    message.delete();
    message.channel.send(sayMessage).catch(e => {
        client.logger.log(e, "error");
        message.channel.send("Error al ejecutar el comando").then(msg => {
            msg.delete({
                timeout: 5000,
            });
        });
    });
};


exports.help = {
    name: "say",
    description: "Hanako-kun habla!",
    category: "misc",
    usage: "say <text>"
};