'use strict';

const client = require('../config/elasticsearch');
const lodash = require('lodash');

module.exports = {

    name: 'elasticsearch',

    settings: {

    },

    actions: {
        deleteIndex: {
            params: {
                index: { type: 'string' },
                $$strict: 'remove'
            },
            handler(ctx) {
                return client.indices.delete(ctx.params);
            }
        },

        createIndex: {
            params: {
                index: { type: 'string' },
                body: { type: 'object' },
                $$strict: 'remove'
            },
            handler(ctx) {
                return client.indices.create(ctx.params);
            }
        },

        bulk: {
            params: {
                index: { type: 'string' },
                body: {
                    type: 'array',
                    items: {
                        type: 'object',
                        props: { id: { type: 'string', convert: true } }
                    }
                },
                $$strict: 'remove'
            },
            handler(ctx) {
                const { index } = ctx.params;
                const body = ctx.params.body.flatMap(doc => [{ create: { _index: index, _id: doc.id } }, lodash.omit(doc, ['id'])]);
                return client.bulk({ refresh: true, body });
            }
        },

        create: {
            params: {
                index: { type: 'string' },
                id: { type: 'string', convert: true },
                body: { type: 'object' },
                $$strict: 'remove'
            },
            handler(ctx) {
                return client.create({ refresh: true, ...ctx.params });
            }
        },

        get: {
            params: {
                index: { type: 'string' },
                id: { type: 'string', convert: true },
                $$strict: 'remove'
            },
            handler(ctx) {
                return client.get(ctx.params);
            }
        },

        update: {
            params: {
                index: { type: 'string' },
                id: { type: 'string', convert: true },
                body: { type: 'object' },
                $$strict: 'remove'
            },
            async handler(ctx) {
                return client.update({ refresh: true, ...ctx.params });
            }
        },

        delete: {
            params: {
                index: { type: 'string' },
                id: { type: 'string', convert: true },
                $$strict: 'remove'
            },
            handler(ctx) {
                return client.delete({ refresh: true, ...ctx.params });
            }
        }
    },

    methods: {

    },

    created() {
        return this.Promise.resolve();
    },

    async started() {
        const { statusCode } = await client.ping();
        if (statusCode !== 200) {
            this.logger.error('Can not connect to elasticsearch server');
            return;
        }

        this.logger.info('Elasticsearch server is ready');
    },

    stopped() {

    }
};
