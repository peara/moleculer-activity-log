'use strict';

const EventLogs = require('../app/models/event_logs');
const lodash = require('lodash');
const { raw } = require('objection');

module.exports = {
    name: 'event-logs',

    /**
     * Actions
     */
    actions: {
        resolveDeactivated: {
            params: {
                property_ids: { type: 'array', items: { type: 'number', integer: true, min: 1 } }
            },
            async handler(ctx) {
                const eventsLogs = await EventLogs
                    .query()
                    .select(raw('distinct on (object_id) object_id, actor_id, actor_type, note, created_at'))
                    .whereIn('object_id', ctx.params.property_ids)
                    .where({ event_name: 'property.deactivated' })
                    .orderBy(['object_id', { column: 'created_at', order: 'desc' }]);

                const keyByEventsLogs = lodash.keyBy(eventsLogs, 'object_id');
                return ctx.params.property_ids.map(id => keyByEventsLogs[id]);
            }
        }
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
        'property.*'(payload, sender, eventName) {
            this.createEventLog({
                actor_id: payload.actor_id,
                actor_type: payload.actor_type,
                object_id: payload.object_id,
                object_type: payload.object_type || 'property',
                event_name: eventName,
                note: payload.note || null,
                changes: payload.changes || {}
            });
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
