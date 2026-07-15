const { start } = require('./bot/bootstrap.js');

start().catch(err => {
    console.error('Fatal error during startup:', err);
    process.exit(1);
});