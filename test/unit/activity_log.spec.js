'use strict';

const { ServiceBroker } = require('moleculer');
const ActivityLogService = require('../../services/activity_logs.service');
const { truncate, disconnectDB } = require('../helpers/test_init');
const moment = require('moment-timezone');

describe("Test 'activity-log' service", () => {
    let broker = new ServiceBroker();
    broker.createService(ActivityLogService);
    let tz = 'Asia/Ho_Chi_Minh';

    beforeAll(async () => {
        await truncate();
        await broker.createService(ActivityLogService);
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
                object: {
                    id: 1,
                    name: {
                        en: 'Fort'
                    }
                }
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
                            object: expect.objectContaining({
                                id: 1,
                                name: {
                                    en: 'Fort'
                                }
                            }),
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
            await broker.emit('property.updated', {
                actor_id: 1,
                actor_type: 'host',
                object: {
                    id: 1,
                    name: {
                        en: 'Citadel'
                    }
                }
            });

            // Get activity log

            setTimeout(async () => {
                const request = await broker.call('activity-log.list', {
                    from: moment.tz(tz).subtract(1, 'days').format(),
                    to: moment.tz(tz).add(1, 'days').format(),
                    object_id: '1',
                    object_type: 'property'
                });

                expect(request.data[1]).toEqual(
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
            }, 2000);
        });

        test('get activity logs empty with data filter ', async () => {
            await broker.emit('property.created', { actor_id: '1', actor_type: 'host', object: { id: 5, name: { en: 'Empty' } } });

            // Get activity log
            const request = await broker.call('activity-log.list', {
                from: moment.tz(tz).add(1, 'days').format(),
                to: moment.tz(tz).add(7, 'days').format(),
                actor_id: '2'
            });
            expect(request.data.length).toEqual(0);
        });
    });

    describe('Test "activity-log.showLatest action"', () => {
        beforeAll(() => truncate());

        test('get list of full recent objects', async (done) => {
            broker.emit('property.created', { actor_id: '1', actor_type: 'host', object: { id: 5, name: { en: 'Empty' } } });
            broker.emit('property.created', { actor_id: '1', actor_type: 'host', object: { id: 6, name: { en: 'Blank' } } });
            broker.emit('property.created', { actor_id: '1', actor_type: 'host', object: { id: 7, name: { en: 'Void' } } });
            broker.emit('property.updated', { actor_id: '1', actor_type: 'host', object: { id: 5, name: { en: 'Not Empty' } } });

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
                            en: 'Not Empty'
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
});
