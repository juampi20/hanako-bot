const Discord = require("discord.js");
const fs = require("fs");
const path = require('path');
//const SQLite = require("better-sqlite3");

const client = new Discord.Client();

client.config = require("./config.js");
client.logger = require("./logger.js");
client.commands = new Discord.Collection();
//client.sql = new SQLite('./data/scores.sqlite');

(async () => {
    client.login(client.config.token);
    await eventsHandler(client, 'events');
    await commandsHandler(client, 'commands')
})();

// Events Handler
async function eventsHandler(client, dir) {
    fs.readdir(path.join(__dirname,'events'), (err, files) => {
        if (err) return client.logger.log(err, "error");
        client.logger.log(`Cargando un total de ${files.length} eventos.`);
        files.forEach(file => {
            // const event = require(`./events/${file}`);
            let event = require(path.join(__dirname,'events',file));
            let eventName = file.split(".")[0];
            client.on(eventName, event.bind(null, client));
        });
    });
};

// Commands Handlers
async function commandsHandler(client, dir) {
    fs.readdir(path.join(__dirname, dir), (err, folders) => {
        if (err) return client.logger.log(err, "error");
        folders.forEach(folder => {
            fs.readdir(path.join(__dirname, dir, folder), (err, files) => {
                if (err) return client.logger.log(err, "error");
                client.logger.log(`Cargando un total de ${files.length} comandos (${folder}).`);
                files.forEach(file => {
                    if (!file.endsWith(".js")) return;
                    // let props = require(`./commands/${folder}/${file}`);
                    let props = require(path.join(__dirname, dir, folder, file));
                    let commandName = file.split(".")[0];
                    client.commands.set(commandName, props);
                });
            });
        });
    });
};