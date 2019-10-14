'use strict';

const knex = require('../../config/database');
const { Model } = require('objection');

class EventLogs extends Model {
    static get tableName() {
        return 'event_logs';
    }
}

EventLogs.knex(knex);

module.exports = EventLogs;
