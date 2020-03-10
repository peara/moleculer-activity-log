'use strict';

const moment = require('moment-timezone');

const EventLogs = require('../app/models/event_logs');

module.exports = {
    name: 'event-logs',

    /**
     * Actions
     */
    actions: {

    },

    /**
     * Events
     */
    events: {
        'booking.*'(payload, sender, eventName) {
            this.createEventLog({
                actor_id: payload.actor_id,
                actor_type: payload.actor_type,
                object_id: payload.booking.id,
                object_type: 'booking',
                event_name: eventName,
                note: payload.note,
                changes: {
                    status: {
                        before: payload.previous_status,
                        after: payload.booking.status
                    }
                }
            });
        },
        // eslint-disable-next-line no-unused-vars
        'property.*'(payload, sender, eventName) {
            let params = {
                index: 'admin-properties',
                id: `${payload.object_id}`,
                body: {
                    doc: {}
                }
            };

            switch (JSON.stringify([payload.changes.status.before, payload.changes.status.after])) {
            case JSON.stringify(['unverified', 'verifying']):
                params.body.doc = {
                    submitted_at: moment()
                };
                break;
            case JSON.stringify(['verifying', 'listed']):
                params.body.doc = {
                    joined_at: moment()
                };
                break;
            case JSON.stringify(['listed', 'blocked']):
                params.body.doc = {
                    blocked_at: moment()
                };
                break;
            default:
                break;
            }

            if (params.body.doc !== {}) {
                this.broker.call('elasticsearch.update', params);
            }
        }
    },

    /**
     * Methods
     */
    methods: {
        createEventLog(params) {
            const paramsSchema = {
                actor_id: {
                    type: 'number', integer: true, positive: true, convert: true
                },
                actor_type: { type: 'enum', values: ['admin', 'host', 'user', 'system'] },
                object_id: {
                    type: 'number', integer: true, positive: true, convert: true
                },
                object_type: { type: 'enum', values: ['booking', 'payment', 'property'] },
                event_name: 'string',
                note: { type: 'string', optional: true },
                changes: 'object',
                $$strict: true
            };
            this.broker.validator.validate(params, paramsSchema);

            return EventLogs
                .query()
                .insert(params)
                .catch(error => this.logger.error(error));
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
