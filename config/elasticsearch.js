const { Client } = require('@elastic/elasticsearch');

const client = new Client({
    node: process.env.ELASTICSEARCH_HOSTS || 'http://localhost:9200'
});

module.exports = client;
