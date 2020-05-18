'use strict';

const { ServiceBroker } = require('moleculer');
const ActivityLog = require('@models/activity_log');
const ActivityLogService = require('../../services/activity_logs.service');
const MockPropertyService = require('../mocks/property.service.js');

const { truncate, disconnectDB } = require('../helpers/test_init');
const moment = require('moment-timezone');

describe("Test 'activity-log' service", () => {
    let broker = new ServiceBroker();
    broker.createService(ActivityLogService);
    let tz = 'Asia/Ho_Chi_Minh';

    beforeAll(async () => {
        await truncate();
        broker.createService(ActivityLogService);
        broker.createService(MockPropertyService);
        await broker.start();
    });

    afterAll(async () => {
        await disconnectDB();
        await broker.stop();
    });

    // A. Empty params
    describe('Test activity_log.list with  params', () => {
        beforeAll(() => truncate());

        test('get activity logs success with data filter params', async (done) => {
            await broker.emit('property.created', {
                actor_id: 1,
                actor_type: 'host',
                object_id: 1
            });

            // Get activity log
            setTimeout(async () => {
                const request = await broker.call('activity-log.list', {
                    from: moment.tz(tz).subtract(1, 'days').format(),
                    to: moment.tz(tz).add(7, 'days').format()
                });
                expect(request.data).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            id: expect.any(Number),
                            action: 'created',
                            actor_id: 1,
                            actor_type: 'host',
                            object_type: 'property',
                            object_id: 1,
                            changes: [{ op: 'add', path: '/id', value: 1 }, { op: 'add', path: '/name', value: { en: 'Fort' } }]
                        })
                    ])
                );
                //
                expect(request.data.length).toEqual(1);
                done();
            }, 1000);
        });

        test('create and get activity logs success with auto create changes', async (done) => {
            await broker.call('admin-property.changeCase', { case: 'update' });
            await broker.emit('property.updated', {
                actor_id: 1,
                actor_type: 'host',
                object_id: 1
            });

            // Get activity log

            setTimeout(async () => {
                const request = await broker.call('activity-log.list', {
                    from: moment.tz(tz).subtract(1, 'days').format(),
                    to: moment.tz(tz).add(1, 'days').format(),
                    object_id: 1,
                    object_type: 'property'
                });

                expect(request.data[0]).toEqual(
                    expect.objectContaining({
                        action: 'updated',
                        changes: [{
                            op: 'replace',
                            path: '/name/en',
                            value: 'Citadel'
                        }]
                    })
                );
                expect(request.data.length).toEqual(2);
                done();
            }, 1000);
        });

        test('get activity logs empty with data filter ', async (done) => {
            await broker.call('admin-property.changeCase', { case: 'update' });
            broker.emit('property.created', { actor_id: '1', actor_type: 'host', object_id: 5 });

            setTimeout(async () => {
            // Get activity log
                const request = await broker.call('activity-log.list', {
                    from: moment.tz(tz).add(1, 'days').format(),
                    to: moment.tz(tz).add(7, 'days').format(),
                    actor_id: 2
                });
                expect(request.data.length).toEqual(0);
                done();
            }, 1000);
        });

        test('activity logs tolerate 3 times retry', async (done) => {
            await broker.call('admin-property.changeCase', { case: 'retry' });
            broker.emit('property.created', { actor_id: '1', actor_type: 'host', object_id: 10 });

            setTimeout(async () => {
                const log = await ActivityLog.query().where({ object_id: 10 }).first();
                expect(log).toEqual(
                    expect.objectContaining({
                        object_id: 10
                    })
                );
                done();
            }, 5000);
        }, 10000);
    });

    describe('Test "activity-log.showLatest action"', () => {
        beforeAll(() => truncate());

        test('get list of full recent objects', async (done) => {
            await broker.call('admin-property.changeCase', { case: 'list' });
            broker.emit('property.created', { actor_id: '1', actor_type: 'host', object_id: 5 });
            broker.emit('property.created', { actor_id: '1', actor_type: 'host', object_id: 6 });
            broker.emit('property.created', { actor_id: '1', actor_type: 'host', object_id: 7 });

            setTimeout(async () => {
                const res = await broker.call('activity-log.showLatest', {
                    object_type: 'property',
                    last_modified_at: moment().add(-1, 'day').format(),
                    object_ids: [5, 6, 7]
                });
                expect(res).toEqual([
                    {
                        id: 5,
                        name: {
                            en: 'Empty'
                        }
                    },
                    {
                        id: 6,
                        name: {
                            en: 'Blank'
                        }
                    },
                    {
                        id: 7,
                        name: {
                            en: 'Void'
                        }
                    }
                ]);
                done();
            }, 2000);
        });
    });

    describe('Test "activity-log.create"', () => {
        beforeAll(() => truncate());

        test('create simple log', async (done) => {
            broker.emit('calendar.lock', {
                actor_id: 1,
                actor_type: 'host',
                object: {
                    accommodation_id: 100,
                    check_in: '2020-01-05',
                    check_out: '2020-01-07',
                    quantity: 1
                }
            });

            setTimeout(async () => {
                const res = await ActivityLog.query().where({ object_type: 'calendar' }).first();
                expect(res).toEqual(
                    expect.objectContaining({
                        action: 'lock',
                        changes: expect.objectContaining({
                            accommodation_id: 100
                        }),
                        object_type: 'calendar'
                    })
                );
                done();
            }, 2000);
        });
    });
});
