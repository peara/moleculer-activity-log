'use strict';

const knex = require('../../config/database');
const CustomQueryBuilder = require('../helpers/custom_query_builder');
const { Model } = require('objection');

class ActivityLog extends Model {
    static get tableName() {
        return 'activity_logs';
    }

    static get softDelete() {
        return false;
    }


    static get QueryBuilder() {
        return CustomQueryBuilder;
    }
}

ActivityLog.knex(knex);

module.exports = ActivityLog;
