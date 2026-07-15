const { createClient } = require('./client.js');
const fs = require('fs');
const path = require('path');

async function start() {
    const client = createClient();
    
    await loadEvents(client);
    await loadCommands(client);
    await client.login(client.config.token);
    
    return client;
}

async function loadEvents(client) {
    return new Promise((resolve) => {
        const dir = path.resolve(__dirname, '..', 'events');
        fs.readdir(dir, (err, files) => {
            if (err) return client.logger.log(err, 'error');
            client.logger.log(`Cargando un total de ${files.length} eventos.`);
            files.forEach(file => {
                const event = require(path.join(dir, file));
                const eventName = file.split('.')[0];
                client.on(eventName, event.bind(null, client));
            });
            resolve();
        });
    });
}

async function loadCommands(client) {
    return new Promise((resolve) => {
        const dir = path.resolve(__dirname, '..', 'commands');
        fs.readdir(dir, (err, folders) => {
            if (err) return client.logger.log(err, 'error');
            folders.forEach(folder => {
                fs.readdir(path.join(dir, folder), (err, files) => {
                    if (err) return client.logger.log(err, 'error');
                    client.logger.log(`Cargando un total de ${files.length} comandos (${folder}).`);
                    files.forEach(file => {
                        if (!file.endsWith('.js')) return;
                        const props = require(path.join(dir, folder, file));
                        const commandName = file.split('.')[0];
                        client.commands.set(commandName, props);
                    });
                });
            });
            resolve();
        });
    });
}

module.exports = { start };