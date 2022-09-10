

const neo4j = require('neo4j-driver');
const dotenv = require('dotenv').config();

const uri = process.env.NEO4J_URI;
const user = process.env.NEO4J_USERNAME;
const password = process.env.NEO4J_PASSWORD;

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

function getConnection() {
    return driver.session({ database: 'neo4j' });
}

module.exports = {
    getConnection
}