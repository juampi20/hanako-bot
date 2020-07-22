require('dotenv').config();

const config = {
    "token": process.env.CLIENT_TOKEN,
    "prefix": process.env.PREFIX,
    "ownerID": process.env.OWNER_ID
};

module.exports = config;