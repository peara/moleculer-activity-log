'use strict';

const { ServiceBroker } = require('moleculer');
const knex = require('../../../config/database');
const { truncate } = require('../../helpers/test_init')(knex);
const EventLogsService = require('../../../services/event_logs.service');

const moment = require('moment-timezone');
const tz = 'Asia/Ho_Chi_Minh';
const dateTimeFormat = 'YYYY-MM-DDTHH:mm:ssZ';

function seedData() {
    const eventLogs = [];

    // id: 1, type system
    eventLogs.push({
        actor_type: 'system',
        object_id: 1,
        object_type: 'booking',
        event_name: 'booking.completed',
        changes: {
            status: {
                after: 'completed',
                before: 'paid'
            }
        }
    });

    // id: 2, type user, actor_id: 1
    eventLogs.push({
        actor_id: 1,
        actor_type: 'user',
        object_id: 1,
        object_type: 'booking',
        event_name: 'booking.requested',
        changes: {
            status: {
                after: 'requested',
                before: 'created'
            }
        }
    });

    // id: 3, type user, actor_id: 1, object_id: 2
    eventLogs.push({
        actor_id: 1,
        actor_type: 'user',
        object_id: 2,
        object_type: 'booking',
        event_name: 'booking.requested',
        changes: {
            status: {
                after: 'requested',
                before: 'created'
            }
        }
    });

    // id: 4, type user, actor_id: 1, object_type: payment
    eventLogs.push({
        actor_id: 1,
        actor_type: 'user',
        object_id: 2,
        object_type: 'payment',
        event_name: 'payment.created',
        changes: {
            status: {
                after: 'created',
                before: null
            }
        }
    });

    // id: 5, has max_created_at
    eventLogs.push({
        actor_id: 1,
        actor_type: 'user',
        object_id: 2,
        object_type: 'booking',
        event_name: 'booking.requested',
        changes: {
            status: {
                after: 'requested',
                before: 'created'
            }
        },
        created_at: moment.tz(tz).subtract(1, 'days')
    });

    return knex('event_logs').insert(eventLogs);
}

describe("Test 'event-logs' service", () => {
    let broker = new ServiceBroker();

    beforeAll(async () => {
        await broker.createService(EventLogsService);
        broker.start();

        await truncate();
        await seedData();
    });
    afterAll(async () => {
        // await disconnectDB();
        await broker.stop();
    });

    describe("Test 'event_logs.resolve' action", () => {
        // object_ids exactly (require)
        test('object_ids exactly (require)', async () => {
            let params = {
                object_ids: [1, 3],
                object_type: 'booking'
            };

            const result = await broker.call('event-logs.resolve', params);

            expect(result).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    object_id: 1,
                    object_type: 'booking',
                    event_name: 'booking.requested',
                    note: null
                }),
                expect.objectContaining({
                    object_id: 1,
                    object_type: 'booking',
                    event_name: 'booking.completed',
                    note: null
                })
            ]));
        });

        // object_type exactly (require)
        test('object_type exactly (require)', async () => {
            let params = {
                object_ids: [2],
                object_type: 'payment'
            };

            const result = await broker.call('event-logs.resolve', params);
            expect(result).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    object_id: 2,
                    object_type: 'payment',
                    event_name: 'payment.created',
                    note: null
                })
            ]));
        });

        // event_names exactly (optional)
        test('event_names exactly (optional)', async () => {
            let params = {
                object_ids: [1, 3],
                object_type: 'booking',
                event_names: ['booking.requested']
            };

            const result = await broker.call('event-logs.resolve', params);
            expect(result).toEqual([
                expect.objectContaining({
                    object_id: 1,
                    object_type: 'booking',
                    event_name: 'booking.requested',
                    note: null
                })
            ]);
        });

        // max_created_at exactly (optional)
        test('max_created_at exactly (optional)', async () => {
            let params = {
                object_ids: [2],
                object_type: 'booking',
                max_created_at: moment.tz(tz).subtract(1, 'days').subtract(-1, 'seconds').format(dateTimeFormat)
            };

            const result = await broker.call('event-logs.resolve', params);
            expect(result).toEqual([
                expect.objectContaining({
                    object_id: 2,
                    object_type: 'booking',
                    event_name: 'booking.requested',
                    note: null
                })
            ]);
        });
    });
});
