'use strict';

const lodash = require('lodash');
const client = require('../config/elasticsearch');

module.exports = {

    name: 'elasticsearch',

    settings: {
        adminPropertiesIndex: {
            index: 'admin-properties',
            body: {
                settings: {
                    analysis: {
                        analyzer: {
                            std_english: { type: 'english' },
                            std_cjk: { type: 'cjk' },
                            std_asciifolding: {
                                tokenizer: 'standard',
                                filter: [
                                    'lowercase',
                                    'asciifolding'
                                ]
                            }
                        }
                    }
                },
                mappings: {
                    properties: {
                        name: {
                            dynamic: 'strict',
                            properties: {
                                vi: { type: 'search_as_you_type', analyzer: 'std_asciifolding' },
                                ja: { type: 'search_as_you_type', analyzer: 'std_cjk' },
                                en: { type: 'search_as_you_type', analyzer: 'std_english' },
                                ko: { type: 'search_as_you_type', analyzer: 'std_cjk' }
                            }
                        },
                        status: { type: 'keyword' },
                        accommodations: {
                            type: 'nested',
                            properties: {
                                booking_type: { type: 'keyword' }
                            }
                        },
                        host: {
                            properties: {
                                name: { type: 'text', analyzer: 'std_asciifolding' },
                                email: { type: 'keyword' }
                            }
                        },
                        address: {
                            properties: {
                                province_id: { type: 'keyword' },
                                district_id: { type: 'keyword' }
                            }
                        },
                        admin_property: {
                            properties: {
                                status: { type: 'keyword' }
                            }
                        },
                        joined_at: { type: 'date' },
                        submitted_at: { type: 'date' },
                        blocked_at: { type: 'date' }
                    }
                }
            }
        }
    },

    actions: {
        ping: {
            handler() {
                return this.ping();
            }
        },

        bulk: {
            params: {
                index: { type: 'string' },
                body: {
                    type: 'array',
                    items: {
                        type: 'object',
                        props: {
                            id: [{ type: 'string' }, { type: 'number', min: 1, integer: true }]
                        }
                    }
                },
                $$strict: 'remove'
            },
            async handler(ctx) {
                const { index, body: bodyPayload } = ctx.params;
                let body = lodash.flatMap(
                    bodyPayload,
                    doc => [{ index: { _index: index, _id: doc.id } }, lodash.omit(doc, ['id'])]
                );
                let res = await client.bulk({ refresh: true, body });
                return res;
            }
        },

        create: {
            params: {
                index: { type: 'string' },
                id: [{ type: 'string' }, { type: 'number', min: 1, integer: true }],
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
                id: [{ type: 'string' }, { type: 'number', min: 1, integer: true }],
                $$strict: 'remove'
            },
            handler(ctx) {
                return client.get(ctx.params);
            }
        },

        update: {
            params: {
                index: { type: 'string' },
                id: [{ type: 'string' }, { type: 'number', min: 1, integer: true }],
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
                id: [{ type: 'string' }, { type: 'number', min: 1, integer: true }],
                $$strict: 'remove'
            },
            handler(ctx) {
                return client.delete({ refresh: true, ...ctx.params });
            }
        },

        updateByQuery: {
            params: {
                index: { type: 'string' },
                body: { type: 'object' },
                $$strict: 'remove'
            },
            handler(ctx) {
                return client.updateByQuery({ refresh: true, ...ctx.params });
            }
        },

        deleteByQuery: {
            params: {
                index: { type: 'string' },
                body: { type: 'object' },
                $$strict: 'remove'
            },
            handler(ctx) {
                return client.deleteByQuery({ refresh: true, ...ctx.params });
            }
        },

        search: {
            params: {
                index: { type: 'string' },
                from: {
                    type: 'number', integer: true, min: 0, optional: true
                },
                size: {
                    type: 'number', integer: true, min: 1, optional: true
                },
                sort: [{ type: 'string', optional: true }, { type: 'array', items: 'string', optional: true }],
                _source: { type: 'boolean', optional: true },
                body: { type: 'object' },
                $$strict: 'remove'
            },
            handler(ctx) {
                return client.search(ctx.params);
            }
        }
    },

    methods: {
        async ping() {
            try {
                await client.ping();
                this.logger.info('Service Elasticsearch connected');
                return {
                    status: 'ok'
                };
            } catch (err) {
                this.logger.error('Can not connect to service Elasticsearch ');
                return {
                    status: 'error'
                };
            }
        },

        async createIndexIfNotExists(structure) {
            try {
                const { body } = await client.indices.exists({ index: structure.index });

                if (!body) {
                    let res = await client.indices.create({ index: structure.index, body: structure.body });
                    if (res.statusCode) {
                        this.logger.info(`Index ${structure.index} was created`);
                    } else {
                        throw new Error();
                    }
                }
            } catch (error) {
                this.logger.error(error);
            }
        }
    },

    created() {

    },

    async started() {
        const { status: status } = await this.ping();

        if (status === 'ok') {
            this.createIndexIfNotExists(this.settings.adminPropertiesIndex);
        }
    },

    stopped() {

    }
};
