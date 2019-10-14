'use strict';

const { ServiceBroker } = require('moleculer');
const ActivityLogService = require('../../services/activity_logs.service');
const { truncate } = require('../helpers/test_init');
const moment = require('moment-timezone');

describe("Test 'activity-logs' service", () => {
    let broker = new ServiceBroker();
    broker.createService(ActivityLogService);
    let tz = 'Asia/Ho_Chi_Minh';
    beforeAll(() => broker.start());
    afterAll(() => broker.stop());

    // A. Empty params
    describe('Test activity_log.get with  params', () => {
        beforeAll(() => truncate());

        test('get activity logs success with data filter params', async (done) => {
            await broker.emit('activity.log', { action: 'auth.login', actor_id: 1, actor_type: 'User' });

            // Get activity log
            setTimeout(async () => {
                const request = await broker.call('activity-logs.get', {
                    from: moment.tz(tz).subtract(1, 'days').format(),
                    to: moment.tz(tz).add(7, 'days').format()
                });
                expect(request.data).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            id: expect.any(Number),
                            action: 'auth.login',
                            actor_id: 1,
                            actor_type: 'User'
                        })
                    ])
                );
                //
                expect(request.data.length).toEqual(1);
                done();
            }, 1000);
        });

        test('create and get activity logs success with auto create changes', async (done) => {
            await broker.emit('activity.log', {
                action: 'profile.update',
                actor_id: '1',
                actor_type: 'User',
                object_id: '1',
                object_type: 'Profile',
                before: {
                    description: 'desc 1',
                    phone: '0987509255',
                    avatar: '',
                    date_of_birth: '02/12/1990',
                    user_id: 1
                },
                after: {
                    description: 'desc 2',
                    phone: '0389867734',
                    avatar: 'abc.jpg',
                    date_of_birth: '05/08/2019',
                    user_id: 1
                }
            });

            // Get activity log

            setTimeout(async () => {
                const request = await broker.call('activity-logs.get', {
                    from: moment.tz(tz).subtract(1, 'days').format(),
                    to: moment.tz(tz).add(1, 'days').format(),
                    object_id: '1',
                    object_type: 'Profile',
                    action: 'profile.update'
                });
                expect(request.data).toEqual(
                    expect.arrayContaining([
                        expect.objectContaining({
                            id: expect.any(Number),
                            action: 'profile.update',
                            actor_id: 1,
                            actor_type: 'User',
                            object_id: 1,
                            object_type: 'Profile'
                        })
                    ])
                );
                const changes = JSON.parse(request.data[0].changes);

                expect(changes).toEqual(
                    expect.objectContaining({
                        description: {
                            before: 'desc 1',
                            after: 'desc 2'
                        },
                        phone: {
                            before: '0987509255',
                            after: '0389867734'
                        },
                        avatar: {
                            before: '',
                            after: 'abc.jpg'
                        },
                        date_of_birth: {
                            before: '02/12/1990',
                            after: '05/08/2019'
                        }
                    })
                );
                expect(request.data.length).toEqual(1);
                done();
            }, 2000);
        });

        test('get activity logs empty with data filter ', async () => {
            await broker.emit('activity.log', { action: 'auth.register', actor_id: '1', actor_type: 'User' });

            // Get activity log
            const request = await broker.call('activity-logs.get', {
                from: moment.tz(tz).add(1, 'days').format(),
                to: moment.tz(tz).add(7, 'days').format(),
                actor_id: '2'
            });
            expect(request.data.length).toEqual(0);
        });
    });
});
