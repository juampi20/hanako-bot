require('dotenv').config();

const config = {
    "token": process.env.CLIENT_TOKEN,
    "prefix": process.env.PREFIX
};

module.exports = config;
