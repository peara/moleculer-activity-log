'use strict';

const { ServiceBroker } = require('moleculer');
const { ValidationError } = require('moleculer').Errors;
const AuthService = require('../../services/base.service');
const { truncate } = require('../helpers/test_init');
const lodash = require('lodash');
const { Context } = require('moleculer');

describe("Test 'auth' service", () => {
    let broker = new ServiceBroker();
    broker.createService(AuthService);

    beforeAll(() => broker.start());
    afterAll(() => broker.stop());

    describe("Test 'base.register' action", () => {
        beforeAll(() => truncate());

        const validParams = {
                email: 'valid-test@gmail.com',
                first_name: 'valid-first-name',
                last_name: 'valid-last-name',
                password: 'valid-password',
                password_confirmation: 'valid-password'
        };

        test('register with empty params', () => {
            return broker.call('base.register').catch(ctx => {
                expect(ctx).toBeInstanceOf(ValidationError);
            });
        });

        test('register new user', () => {
            // broker.call pass params directly to action, which can modify the value of params
            return expect(broker.call('base.register', lodash.cloneDeep(validParams))).resolves.toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        email: 'valid-test@gmail.com',
                        first_name: 'valid-first-name',
                        last_name: 'valid-last-name'
                    })
                ])
            );
        });

        test('cannot register duplicated user', () => {
            return expect(broker.call('base.register', lodash.cloneDeep(validParams))).rejects.toThrow(ValidationError);
        });

        test('cannot register invalid data', () => {
            const invalidParams = {
                    id: '12121212',
                    email: 'valid@gmail',
                    first_name: '',
                    last_name: '',
                    password: '1234',
                    password_confirmation: '1234'
            };
            return broker.call('base.register', lodash.cloneDeep(invalidParams)).catch(err => {
                expect(err).toBeInstanceOf(ValidationError);
                expect(err.data.map(e => [e.field, e.type])).toEqual(
                    expect.objectContaining({
                        data:
                            expect.arrayContaining([
                            ['user', 'objectStrict'],
                            ['user.first_name', 'stringMin'],
                            ['user.last_name', 'stringMin'],
                            ['user.password', 'stringMin'],
                            ['user.password_confirmation', 'stringMin'],
                            ['user.email', 'email']
                        ])
                    })
                );
            });
        });

        test('cannot register first_name too long', () => {
            const invalidParams = lodash.merge({}, validParams, { user: { first_name: 'a'.repeat(201) } });
            const error = {
                code: 422,
                type: 'VALIDATION_ERROR',
                data: [
                    {
                        type: 'stringMax',
                        field: 'user.first_name'
                    }
                ]
            };
            return expect(
                broker.call('base.register', lodash.cloneDeep(invalidParams))
            ).rejects.toMatchObject(error);
        });

        test('cannot register last_name too long', () => {
            const invalidParams = lodash.merge({}, validParams, { user: { last_name: 'a'.repeat(201) } });
            const error = {
                code: 422,
                type: 'VALIDATION_ERROR',
                data: [
                    {
                        type: 'stringMax',
                        field: 'user.last_name'
                    }
                ]
            };
            return expect(
                broker.call('base.register', lodash.cloneDeep(invalidParams))
            ).rejects.toMatchObject(error);
        });

        test('cannot register password too short', () => {
            const invalidParams = lodash.merge({}, validParams, {  password: '1234567', password_confirmation: '1234567' });
            const error = {
                code: 422,
                type: 'VALIDATION_ERROR',
                data: [
                    {
                        type: 'stringMin',
                        field: 'user.password'
                    },
                    {
                        type: 'stringMin',
                        field: 'user.password_confirmation'
                    }
                ]
            };
            return expect(
                broker.call('base.register', lodash.cloneDeep(invalidParams))
            ).rejects.toMatchObject(error);
        });


        test('cannot register password contains invalid character', () => {
            const invalidParams = lodash.merge({}, validParams, { password: '1234567ạ', password_confirmation: '1234567ạ' });
            const error = {
                code: 422,
                type: 'VALIDATION_ERROR',
                data: [
                    {
                        type: 'stringPattern',
                        field: 'user.password'
                    },
                    {
                        type: 'stringPattern',
                        field: 'user.password_confirmation'
                    }
                ]
            };
            return expect(
                broker.call('base.register', lodash.cloneDeep(invalidParams))
            ).rejects.toMatchObject(error);
        });

        test('cannot register when password confirmation not match', () => {
            const invalidParams = lodash.merge({}, validParams, { email: 'test-2@gmail.com', password_confirmation: 'not-match-password' } );
            const error = {
                code: 422,
                type: 'VALIDATION_ERROR',
                message: 'password-confirmation-not-match'
            };
            return expect(
                broker.call('base.register', invalidParams)
            ).rejects.toMatchObject(error);
        });
    });

    describe('Test base.login & base.logout', () => {
        beforeAll(() => truncate());

        const validUserParams = {
                email: 'valid-test@gmail.com',
                first_name: 'valid-first-name',
                last_name: 'valid-last-name',
                password: 'valid-password',
                password_confirmation: 'valid-password'
        };

        const validLoginParams = {
                email: 'valid-test@gmail.com',
                password: 'valid-password'
        };

        let loginToken;
        let refreshToken;
        let user;

        test('cannot login because user not exist', () => {
            const params = {
                    email: 'not-existed@gmail.com',
                    password: 'wrong-password'
            };
            return expect(broker.call('base.login', params)).rejects.toThrow();
        });

        test('login successfully', async () => {
            await broker.call('base.register', lodash.cloneDeep(validUserParams));
            const res = await broker.call('base.login', validLoginParams);
            loginToken = res.access_token;
            refreshToken = res.refresh_token;
            user = res.user;

            expect(res).toEqual(
                expect.objectContaining({
                    data:{
                        access_token: expect.any(String),
                        refresh_token: expect.any(String),
                        token_type: 'Bearer',
                        user: expect.objectContaining({
                            email: 'valid-test@gmail.com',
                            first_name: 'valid-first-name',
                            last_name: 'valid-last-name',
                            id: expect.any(Number)
                        })
                    }
                })
            );
        });

        test('cannot login with wrong password', () => {
            const params = {
                user: {
                    email: 'valid-test@gmail.com',
                    password: 'wrong-password'
                }
            };
            return expect(broker.call('base.login', params)).rejects.toThrow();
        });

        test('cannot logout with wrong token', () => {
            const params = {
                token: 'Bearer eyJ0eX'
            };
            return expect(broker.call('base.logout', params)).rejects.toThrow();
        });

    });

});
