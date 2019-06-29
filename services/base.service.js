'use strict';

const { MoleculerClientError, ValidationError } = require('moleculer').Errors;
const { AuthenticationError } = require('../app/helpers/errors');
const { User, Jwt } = require('../app/models');

module.exports = {
    name: 'base',
    /**
     * Service settings
     */
    settings: {
    /** Secret for JWT */
        JWT_SECRET: process.env.JWT_SECRET || 'jwt-conduit-secret',

        /** Public fields */
        fields: ['_id', 'email', 'password'],

        /** Validator schema for entity */
        entityValidator: {
            password: { type: 'string', min: 6 },
            email: { type: 'email' }
        },
        maxRetryTime: 3
    },

    /**
     * Service dependencies
     */
    // dependencies: [],

    /**
     * Actions
     */
    actions: {

        /**
         * Login with username & password
         *
         * @actions
         * @param {Object} user - User credentials
         *
         * @returns {Object} Logged in user with token
         */
        login: {
            params: {
                user: {
                    type: 'object',
                    props: {
                        email: { type: 'email' },
                        password: { type: 'string', min: 8 },
                        $$strict: true
                    }
                }
            },
            handler(ctx) {
                return User.login(ctx.params.user)
                    .then(data => {
                        return Promise.all([data, Jwt.create(data)]);
                    })
                    .then(data => {
                        return this.transformLogin(data[0]);
                    })
                    .catch(err => {
                        if (err instanceof AuthenticationError) return Promise.reject(err);
                        return Promise.reject(new MoleculerClientError(err.message, 500, '', [{ message: err.message }]));
                    });
            }
        },

        register: {
            params: {
                user: {
                    type: 'object',
                    props: {
                        email: { type: 'email', mode: 'precise' },
                        first_name: { type: 'string', min: 1, max: 200 },
                        last_name: { type: 'string', min: 1, max: 200 },
                        password: { type: 'string', min: 8, pattern: /^[ -~]*$/ },
                        password_confirmation: { type: 'string', min: 8, pattern: /^[ -~]*$/ },
                        $$strict: true
                    }
                }
            },
            handler(ctx) {
                const params = ctx.params.user;
                return User.findOne({ email: params.email })
                    .then(user => {
                        if (user) throw new ValidationError('user-existed', null, '', []);

                        if (params.password !== params.password_confirmation) {
                            throw new ValidationError('password-confirmation-not-match', null, '', []);
                        }

                        delete params.password_confirmation;
                        // Emit an event to all service
                        this.broker.emit('base.register', { service: 'base', method: 'register', params });
                        return User.create(params);
                    }).then(result=>{
                        if(result!== undefined) return {data: result};
                        throw new MoleculerClientError('Unexpected Error', null, '', []);
                    })
            }
        },

    },
    /**
     * Events
     */
    events: {
        'base.register'(payload) {
            this.logger.info('base register user : ', payload);
            // Update all message that have this locale to locale_id :0
            if (payload.times >= this.settings.maxRetryTime) {
                this.logger.error('base register fail ', payload);
                //After 3 times email to developer
                //TODO create mail service
                this.broker.emit('email.handle-error', { service: 'base', method: 'register', payload });
            } else {
                try {
                    //Do event handler here
                    //TODO
                    //eg : Create profile
                    //this.broker.call();
                } catch (error) {
                    this.logger.error('event base register fail: ' + error.message);
                }
            }
        }
    },

    /**
     * Methods
     */
    methods: {
        transformLogin(data) {
            if (data.user && data.token) {
                return Promise.resolve({
                    data:{
                        token_type: 'Bearer',
                        access_token: data.token.accessToken,
                        refresh_token: data.token.refreshToken,
                        user: data.user
                    }
                });
            }
            return Promise.reject(new MoleculerClientError('Unexpected Error!', 500, '', []));
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
