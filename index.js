const Discord = require("discord.js");
const fs = require("fs");
const SQLite = require("better-sqlite3");

const client = new Discord.Client();

client.config = require("./config.js");
client.logger = require("./logger.js");
client.commands = new Discord.Collection();
client.sql = new SQLite('./data/scores.sqlite');

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

    fs.readdir(`./commands/`, (err, folders) => {
        if (err) return client.logger.log(err, "error");
        folders.forEach(folder => {
            fs.readdir(`./commands/${folder}`, (err, files) => {
                if (err) return client.logger.log(err, "error");
                client.logger.log(`Cargando un total de ${files.length} comandos (${folder}).`);
                files.forEach(file => {
                    if (!file.endsWith(".js")) return;
                    let props = require(`./commands/${folder}/${file}`);
                    let commandName = file.split(".")[0];
                    client.commands.set(commandName, props);
                });
            });
        });
    });

    client.login(client.config.token);
};

init();