'use strict';

const knex = require('../../config/database.js');

var tables = [
    'users'
];

function truncate() {
    return knex.raw('truncate table users cascade');
    // return Promise.all(tables.map(table => knex.raw('truncate table ' + table + ' cascade')));
}

module.exports = {
    truncate
};
