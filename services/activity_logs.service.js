'use strict';

const { ValidationError } = require('moleculer').Errors;
const lodash = require('lodash');
const knex = require('../config/database');
const moment = require('moment-timezone');
var jsonDiff = require('json-diff');
module.exports = {
    name: 'activity-logs',
    /**
     * Service settings
     */
    settings: {
        dateFormat: 'YYYY-MM-DD',
        tz: 'Asia/Ho_Chi_Minh'
    },

    /**
     * Actions
     */
    actions: {

        /**
         * Get list object activity logs
         *
         * @actions
         * @param {String} object_type - Type of affected object
         * @param {Integer} object_id - Id of affected object
         * @param {Integer} actor_id - Id of user related to the log
         * @param {Integer} actor_type - Number of page
         *
         * @returns {Object} List of message
         */
        get: {
            params: {
                action: { type: 'string', optional: true },
                object_type: { type: 'string', optional: true },
                object_id: { type: 'string', optional: true },
                actor_id: { type: 'string', optional: true },
                actor_type: { type: 'string', optional: true },
                from: { type: 'string' },
                to: { type: 'string' },
                page: {
                    type: 'string', integer: true, positive: true, optional: true
                },
                limit: {
                    type: 'number', integer: true, positive: true, optional: true
                },
                $$strict: true
            },
            handler(ctx) {
                const params = ctx.params;
                let filters = {};
                let page = 1;
                let limit = 10;
                const from = moment.tz(
                    ctx.params.from,
                    this.settings.dateFormat,
                    this.settings.tz
                );
                const to = moment.tz(
                    ctx.params.to,
                    this.settings.dateFormat,
                    this.settings.tz
                );
                if (
                    from === 'Invalid date'
                    || to === 'Invalid date'
                    || from >= to
                ) throw new ValidationError('invalid-date', null, '', []);

                filters = lodash.pick(params, ['action', 'object_id', 'object_type', 'actor_id', 'actor_type']);
                // Prepare filters
                if ('object_id' in params) params.object_id = Number.parseInt(params.object_id, 10);
                if ('actor_id' in params) params.object_id = Number.parseInt(params.actor_id, 10);
                if ('page' in params) page = params.page;
                if ('limit' in params) limit = params.limit;

                return knex.from('activity_logs')
                    .where(filters)
                    .where('created_at', '>=', from)
                    .where('created_at', '<=', to)
                    .offset((page - 1) * limit)
                    .limit(limit)
                    .timeout(2000)
                    .then(results => {
                        if (results === undefined || results.length === 0) {
                            return { data: [] };
                        }
                        return { data: results };
                    });
            }
        }
    },

    /**
     * Events
     */
    events: {
        'activity.log'(payload) {
            let record = lodash.omit(payload, ['before', 'after']);
            record.changes = this.difference(payload);
            knex('activity_logs')
                .insert(record)
                .returning(['id', 'changes'])
                .then(([log]) => {
                    if (log === undefined) {
                        this.logger.error('activity log created failed: cannot create activity_log object');
                    } else {
                        this.logger.info('activity log created successfully: ', log);
                    }
                });
        }
    },

    /**
     * Methods
     */
    methods: {
        difference(params) {
            let before = params.before;
            let after = params.after;
            return jsonDiff.diff(before, after);
        }
    },

    /**
     * Service created lifecycle event handler
     */
    created() {
        global.Promise = this.Promise;
    },

    /**
     * Service started lifecycle event handler
     */
    started() {

    },

    /**
     * Service stopped lifecycle event handler
     */
    stopped() {

    }
};
