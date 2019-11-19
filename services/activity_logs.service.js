'use strict';

const { ValidationError } = require('moleculer').Errors;
const lodash = require('lodash');
const moment = require('moment-timezone');
const ActivityLog = require('../app/models/activity_log');
const jsonpatch = require('fast-json-patch');
const _ = require('lodash');

module.exports = {
    name: 'activity-log',
    /**
     * Service settings
     */
    settings: {
        dateFormat: 'YYYY-MM-DD',
        tz: 'Asia/Ho_Chi_Minh',
        trackedTypes: ['property']
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
        list: {
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
                per_page: {
                    type: 'number', integer: true, positive: true, optional: true
                },
                $$strict: true
            },
            handler(ctx) {
                const params = ctx.params;
                let filters = {};
                const page = parseInt(ctx.params.page, 10) || 1;
                const perPage = parseInt(ctx.params.per_page, 10) || 10;
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

                return ActivityLog.query()
                    .where(filters)
                    .where('created_at', '>=', from)
                    .where('created_at', '<=', to)
                    .page(page, perPage);
            }
        },

        showLatest: {
            params: {
                object_type: 'string',
                last_modified_at: 'string'
            },
            handler(ctx) {
                const lastModifiedAt = moment(ctx.params.last_modified_at);
                return ActivityLog.query()
                    .where({ object_type: ctx.params.object_type })
                    .where('created_at', '>', lastModifiedAt)
                    .distinct('object_id')
                    .pluck('object_id')
                    .orderBy('object_id')
                    .then(ids => {
                        return Promise.all(ids.map(id => {
                            return this.regenerate({
                                object_type: ctx.params.object_type,
                                object_id: id
                            });
                        })).then(res => {
                            return _.map(res, 'before');
                        });
                    });
            }
        }
    },

    /**
     * Events
     */
    events: {
        '*.*'(payload, sender, eventName) {
            return this.log(payload, eventName, 0);
        }
    },

    /**
     * Methods
     */
    methods: {
        // params should has:
        // - object_type
        // - object_id
        async regenerate(params) {
            // TODO using config of object type
            const logs = await ActivityLog.query().where(params).orderBy('id').limit(10);
            const checkpoint = logs.findIndex(log => {
                return log.object;
            });
            let before = {};
            // if find a checkpoint
            if (checkpoint > -1) before = logs[checkpoint].object;
            for (let i = checkpoint + 1; i < logs.length; i += 1) {
                before = jsonpatch.applyPatch(before, logs[i].changes).newDocument;
            }
            return {
                before,
                version: logs.length > 0 ? logs[logs.length - 1].version : -1
            };
        },

        async log(payload, eventName, count) {
            const [objectType, action] = eventName.split('.');
            if (this.settings.trackedTypes.includes(objectType)) {
                let { before, version } = await this.regenerate({
                    object_type: objectType,
                    object_id: payload.object.id
                });
                const changes = jsonpatch.compare(before, payload.object);
                version += 1;
                const activityLog = ActivityLog.fromJson({
                    actor_type: payload.actor_type,
                    actor_id: payload.actor_id,
                    object_type: objectType,
                    object_id: payload.object.id,
                    changes: JSON.stringify(changes),
                    action,
                    version
                });
                // TODO using config of object type
                if (version % 10 === 0) {
                    activityLog.object = payload.object;
                }
                return activityLog.$query().insert()
                    .catch(err => {
                        if (err.message.includes('duplicate key value') && count < 3) {
                            // retry
                            setTimeout(() => {
                                return this.log(payload, eventName, count + 1);
                            }, 1000);
                        } else {
                            this.logger.error(err);
                        }
                    });
            }
            return Promise.resolve();
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
