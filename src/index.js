const { Client, Collection, GatewayIntentBits } = require("discord.js");
const config = require("./config/bot");
const logger = require("./utils/logger");
const loadEvents = require("./handlers/loaders/events");
const { loadCommands } = require("./handlers/loaders/commands");
const attachFunctions = require("./handlers/functions");

async function start() {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildVoiceStates,
        ],
    });

    client.config = config;
    client.logger = logger;
    client.commands = new Collection();
    client.interactions = new Collection();
    client.middleware = [];
    client.levelingService = null;

    // Attach reusable helpers (embed, errNormal, etc.)
    attachFunctions(client);

    loadEvents(client);
    loadCommands(client);
    await loadMiddleware(client);
    await client.login(config.token);

    return client;
}

async function loadMiddleware(client) {
    const fs = require("fs");
    const path = require("path");
    const dir = path.resolve(__dirname, "middleware");
    const files = fs.readdirSync(dir);

    const middleware = [];
    for (const file of files) {
        if (!file.endsWith(".js")) { continue; }
        try {
            const middlewareFn = require(path.join(dir, file));
            middleware.push(middlewareFn);
        } catch (err) {
            client.logger.log(err, "error");
        }
    }

    middleware.sort((a, b) => (a.priority || 50) - (b.priority || 50));
    client.middleware = middleware;
    client.logger.log(
        `Cargando un total de ${middleware.length} middleware.`,
        "log"
    );
}

start().catch((err) => {
    console.error("Fatal error during startup:", err);
    process.exit(1);
});
