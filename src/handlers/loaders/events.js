const fs = require("fs");
const path = require("path");

module.exports = (client) => {
    const eventsDir = path.resolve(__dirname, "..", "..", "events");
    let totalLoaded = 0;

    // Scan subdirectories (client/, guild/, etc.)
    const categories = fs.readdirSync(eventsDir);
    for (const category of categories) {
        const categoryPath = path.join(eventsDir, category);
        if (!fs.statSync(categoryPath).isDirectory()) { continue; }

        const files = fs
            .readdirSync(categoryPath)
            .filter((f) => f.endsWith(".js"));

        for (const file of files) {
            const eventName = file.split(".")[0];
            const eventPath = path.join(categoryPath, file);
            const eventFn = require(eventPath);

            client.on(eventName, async (...args) => {
                try {
                    await eventFn(client, ...args);
                } catch (err) {
                    client.logger?.error?.(`Unhandled error in event ${eventName}: ${err?.message || err}`);
                }
            });
            totalLoaded++;
        }
    }

    client.logger.log(
        `Cargando un total de ${totalLoaded} eventos.`,
        "log"
    );
};
