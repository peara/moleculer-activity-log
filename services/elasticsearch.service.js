'use strict';

const lodash = require('lodash');
const QueueService = require('moleculer-bull');

const client = require('../config/elasticsearch');
const QueueConfig = require('../config/queue');

module.exports = {

    name: 'elasticsearch',

    settings: {

    },

    mixins: [QueueService(QueueConfig.url)],

    queues: {
        'elasticsearch.bulk': {
            concurrency: 5,
            async process(job) {
                const params = job.data;
                const body = params.body.flatMap(doc => [{ index: { _index: params.index, _id: doc.id } }, lodash.omit(doc, ['id'])]);
                const { body: bulkResponse } = await client.bulk({ refresh: true, body });
                if (bulkResponse.errors) {
                    const erroredDocuments = [];
                    bulkResponse.items.forEach((action, i) => {
                        const operation = Object.keys(action)[0];
                        if (action[operation].error) {
                            erroredDocuments.push({
                                status: action[operation].status,
                                error: action[operation].error,
                                operation: body[i * 2],
                                document: body[i * 2 + 1]
                            });
                        }
                    });
                    this.logger.error(erroredDocuments);
                }
                const { body: { count: size } } = await client.count({ index: params.index });
                this.logger.info(`There are ${size} documents on index ${params.index}`);
            }
        }
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
                        props: { id: { type: 'string', optional: true } }
                    }
                },
                $$strict: 'remove'
            },
            async handler(ctx) {
                this.createJob('elasticsearch.bulk', ctx.params, { removeOnComplete: true });
                return true;
            }
        },

        insert: {
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
        try {
            const { statusCode } = await client.ping();
            if (statusCode === 200) {
                this.logger.info('Elasticsearch server is ready');
            } else {
                throw new Error();
            }
        } catch (error) {
            this.logger.error('Can not connect to elasticsearch server');
        }
    },

    stopped() {
        this.getQueue('elasticsearch.bulk').close();
    }
};
