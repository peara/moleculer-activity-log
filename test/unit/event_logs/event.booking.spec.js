'use strict';

const { ServiceBroker } = require('moleculer');
const knex = require('../../../config/database');
const { truncate, disconnectDB } = require('../../helpers/test_init')(knex);
const EventLogs = require('../../../app/models/event_logs');
const EventLogsService = require('../../../services/event_logs.service');

describe("Test 'event-logs' service", () => {
    let broker = new ServiceBroker();
    broker.createService(EventLogsService);

    beforeAll(async () => {
        await broker.start();
    });
    afterAll(async () => {
        await disconnectDB();
        await broker.stop();
    });

    const bookingStatus = [
        'created', 'invalid', 'requested', 'declined',
        'payment_pending', 'expired', 'guest_cancelled',
        'paid', 'host_cancelled', 'checked_in', 'claimed', 'completed'
    ];

    let bookingStatusTest = (status) => {
        describe("Test event 'booking.*'", () => {
            beforeAll(async () => {
                await truncate();
            });
            test(`Logs event successfully when booking'status is ${status}`, (done) => {
                const eventParams = {
                    actor_id: 1,
                    actor_type: 'user',
                    previous_status: null,
                    note: 'This is test',
                    booking: {
                        id: 1,
                        status: `${status}`
                    }
                };
                broker.emit(`booking.${status}`, eventParams);
                setTimeout(() => {
                    return EventLogs.query()
                        .where({
                            object_id: eventParams.booking.id,
                            object_type: 'booking',
                            event_name: `booking.${status}`
                        })
                        .first()
                        .then(eventlogs => {
                            expect(eventlogs).toEqual(
                                expect.objectContaining({
                                    actor_id: 1,
                                    actor_type: 'user',
                                    object_id: eventParams.booking.id,
                                    object_type: 'booking',
                                    event_name: `booking.${status}`,
                                    note: 'This is test',
                                    changes: {
                                        status: {
                                            before: null,
                                            after: `${status}`
                                        }
                                    }
                                })
                            );
                            done();
                        });
                }, 200);
            });
        });
    };

    bookingStatus.forEach(status => {
        bookingStatusTest(status);
    });
});
