'use strict';

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
            this.logsEvent(payload, 'booking', eventName);
        }
    },

    /**
     * Methods
     */
    methods: {
        logsEvent(payload, eventType, eventName) {
            return EventLogs.query()
                .insert({
                    actor_id: payload.actor_id,
                    actor_type: payload.actor_type,
                    object_id: payload.booking.id,
                    object_type: eventType,
                    event_name: eventName,
                    note: payload.note,
                    changes: {
                        status: {
                            before: payload.previous_status,
                            after: payload.booking.status
                        }
                    }
                }).catch(error => this.logger.error(error));
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
