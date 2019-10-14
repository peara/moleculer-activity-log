'use strict';

const knex = require('../../config/database.js');

let tables = [
    'event_logs',
    'activity_logs'
];

function truncate() {
    return Promise.all(tables.map(table => knex.raw('TRUNCATE ' + table + ' RESTART IDENTITY CASCADE;')));
}

async function disconnectDB() {
    await knex.connection().client.pool.destroy();
}

module.exports = {
    truncate, disconnectDB
};
