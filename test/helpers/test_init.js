'use strict';

const knex = require('../../config/database.js');

function truncate() {
    return Promise.all([
        knex.raw('truncate activity_logs cascade')
    ]);
}

module.exports = {
    truncate
};
