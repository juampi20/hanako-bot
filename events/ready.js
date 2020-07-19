module.exports = (client) => {
    client.logger.log(`El Bot ${client.user.tag} esta listo.`, "ready");
    client.user.setActivity("Made with ❤");

    // SQLite Level System
    /*
    const table = client.sql.prepare("SELECT count(*) FROM sqlite_master WHERE type='table' AND name = 'scores';").get();
    if (!table['count(*)']) {
        // Si la tabla no está ahi, crea y configura la base de datos correctamente.
        client.sql.prepare("CREATE TABLE scores (id TEXT PRIMARY KEY, user TEXT, guild TEXT, points INTEGER, level INTEGER);").run();
        client.sql.prepare("CREATE UNIQUE INDEX idx_scores_id ON scores (id);").run();
        client.sql.pragma("synchronous = 1");
        client.sql.pragma("journal_mode = wal");
    }

    // Y luego tenemos dos declaraciones preparadas para obtener y establecer los datos de puntaje.
    client.getScore = client.sql.prepare("SELECT * FROM scores WHERE user = ? AND guild = ?");
    client.setScore = client.sql.prepare("INSERT OR REPLACE INTO scores (id, user, guild, points, level) VALUES (@id, @user, @guild, @points, @level);");
    */
};