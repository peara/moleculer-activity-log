'use strict';

const { ServiceBroker } = require('moleculer');
const client = require('../../config/elasticsearch');

const ElasticsearchService = require('../../services/elasticsearch.service');

describe("Test 'elasticsearch' service", () => {
    /**
     * Turn on elasticsearch server before run this test
     */
    let broker = new ServiceBroker();
    broker.createService(ElasticsearchService);

    test('Ping server success', async () => {
        const { statusCode } = await client.ping();
        expect(statusCode).toEqual(200);
    });
});
