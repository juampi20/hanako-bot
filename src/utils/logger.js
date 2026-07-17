const chalk = require("chalk");
const moment = require("moment");

exports.log = (content, type = "log") => {
    const timestamp = `[${moment().format("DD-MM-YYYY HH:mm:ss")}]`;
    switch (type) {
        case "log": {
            return console.log(`${timestamp} ${chalk.bgBlue(type.toUpperCase())} ${content} `);
        }
        case "warn": {
            return console.log(`${timestamp} ${chalk.black.bgYellow(type.toUpperCase())} ${content} `);
        }
        case "error": {
            return console.log(`${timestamp} ${chalk.bgRed(type.toUpperCase())} ${content} `);
        }
        case "debug": {
            return console.log(`${timestamp} ${chalk.green(type.toUpperCase())} ${content} `);
        }
        case "cmd": {
            return console.log(`${timestamp} ${chalk.black.bgWhite(type.toUpperCase())} ${content} `);
        }
        case "ready": {
            return console.log(`${timestamp} ${chalk.black.bgGreen(type.toUpperCase())} ${content} `);
        }
        default:
            throw new TypeError("El tipo de Logger debe ser warn, debug, log, ready, cmd o error.");
    }
};

exports.error = (...args) => exports.log(args.map(a => typeof a === 'object' ? a?.message || String(a) : String(a)).join(' '), "error");
exports.warn = (...args) => exports.log(args.map(a => typeof a === 'object' ? a?.message || String(a) : String(a)).join(' '), "warn");
exports.debug = (...args) => exports.log(args.map(a => typeof a === 'object' ? a?.message || String(a) : String(a)).join(' '), "debug");
exports.cmd = (...args) => exports.log(args.map(a => typeof a === 'object' ? a?.message || String(a) : String(a)).join(' '), "cmd");