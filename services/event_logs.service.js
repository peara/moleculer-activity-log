'use strict';

const EventLogs = require('../app/models/event_logs');
const lodash = require('lodash');
const { raw } = require('objection');
const moment = require('moment-timezone');
const { ValidationError } = require('moleculer').Errors;

module.exports = {
    name: 'event-logs',

    settings: {
        dateFormat: 'YYYY-MM-DD',
        dateTimeFormat: 'YYYY-MM-DDTHH:mm:ssZ',
        tz: 'Asia/Ho_Chi_Minh'
    },

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
        },

        /**
         * Get list event log with some filter
         */
        resolve: {
            visibility: 'public',
            params: {
                object_ids: { type: 'array', items: 'number' },
                object_type: { type: 'enum', values: ['booking', 'payment'] },
                event_names: { type: 'array', items: 'string', optional: true },
                max_created_at: { type: 'string', optional: true }, // format: YYYY-MM-DDTHH:mm:ssZ
                $$strict: true
            },
            handler(ctx) {
                let query = EventLogs.query()
                    .where('object_type', ctx.params.object_type)
                    .whereIn('object_id', ctx.params.object_ids);

                if (ctx.params.event_names) {
                    query = query.whereIn('event_name', ctx.params.event_names);
                }

                if (ctx.params.max_created_at) {
                    const maxCreatedAt = moment.tz(
                        ctx.params.max_created_at, this.settings.dateTimeFormat, true, this.settings.tz
                    );

                    if (!maxCreatedAt.isValid()) {
                        throw new ValidationError('max-created-at-invalid', null, []);
                    }

                    query = query.where('created_at', '<=', ctx.params.max_created_at);
                }

                return query.select(['object_id', 'object_type', 'event_name', 'note', 'changes', 'created_at', 'actor_id', 'actor_type']);
            }
        }
    },

    /**
     * Events
     */
    events: {
        'booking.*'(payload, sender, eventName) {
            this.createEventLog({
                actor_id: payload.actor_id || null,
                actor_type: payload.actor_type,
                object_id: payload.booking.id,
                object_type: 'booking',
                event_name: eventName,
                note: payload.note || null,
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
