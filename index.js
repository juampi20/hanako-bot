const Discord = require("discord.js");
const fs = require("fs");

const client = new Discord.Client();

client.config = require("./config.js");
client.logger = require("./logger.js");
client.commands = new Discord.Collection();

const init = async () => {
    fs.readdir("./events/", (err, files) => {
        if (err) return client.logger.log(err, "error");
        client.logger.log(`Cargando un total de ${files.length} eventos.`);
        files.forEach(file => {
            const event = require(`./events/${file}`);
            let eventName = file.split(".")[0];
            client.on(eventName, event.bind(null, client));
        });
    });

    const stuff = ["fun", "nsfw", "misc"];
    stuff.forEach(folders => {
        fs.readdir(`./commands/${folders}`, (err, files) => {
            if (err) return client.logger.log(err, "error");
            client.logger.log(`Cargando un total de ${files.length} comandos (${folders}).`);
            files.forEach(file => {
                if (!file.endsWith(".js")) return;
                let props = require(`./commands/${folders}/${file}`);
                let commandName = file.split(".")[0];
                client.commands.set(commandName, props);
            });
        });
    });

    client.login(client.config.token);
};

init();