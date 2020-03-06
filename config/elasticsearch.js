const { Client } = require('@elastic/elasticsearch');

const client = new Client({
    node: process.env.ELASTICSEARCH || 'http://localhost:9200'
});

module.exports = client;
