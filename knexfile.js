'use strict';

const path = require('path');

const migrations = {
    directory: path.join(__dirname, 'migrations')
};

const seeds = {
    directory: path.join(__dirname, 'seeds')
};

const baseConfig = {
    client: 'pg',
    version: '11.3',
    migrations,
    seeds
};

module.exports = {
    development: {
        ...baseConfig,
        connection: {
            host: process.env.ACTIVITY_DB_HOST || 'localhost',
            user: process.env.ACTIVITY_DB_USER || 'super_node',
            password: process.env.ACTIVITY_DB_PASSWORD || 'node@node',
            database: process.env.ACTIVITY_DB_NAME || 'activity-log_dev',
            port: process.env.ACTIVITY_DB_PORT || '5432'
        }
    },
    test: {
        ...baseConfig,
        connection: {
            host: 'localhost',
            user: 'super_node',
            password: 'node@node',
            database: 'activity-log_test',
            port: '5432'
        }
    },
    ci: {
        ...baseConfig,
        connection: {
            host: 'postgres',
            user: 'super_node',
            password: 'node@node',
            database: 'activity-log_test',
            port: '5432'
        }
    },
    staging: {
        ...baseConfig,
        connection: {
            host: '127.0.0.1',
            user: 'postgres',
            password: 'nodev1db',
            database: 'base_staging',
            port: '5432'
        },
        pool: {
            min: 2,
            max: 10
        }
    },
    production: {
        ...baseConfig,
        connection: {
            host: '127.0.0.1',
            user: 'postgres',
            password: 'nodev1db',
            database: 'base_prod',
            port: '5432'
        },
        pool: {
            min: 2,
            max: 10
        }
    },
    onUpdateTrigger: table => `
    CREATE TRIGGER ${table}_updated_at
    BEFORE UPDATE ON ${table}
    FOR EACH ROW
    EXECUTE PROCEDURE on_update_timestamp();`
};
