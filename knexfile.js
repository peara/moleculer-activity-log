'use strict';

// TODO refactor this
module.exports = {
    development: {
        client: 'pg',
        version: '11.3',
        connection: {
            host: 'localhost',
            user: 'super_node',
            password: 'node@node',
            database: 'super_lux',
            port: '5432'
        },
        migrations: {
            directory: __dirname + '/migrations'
        },
        seeds: {
            directory: __dirname + '/seeds'
        }
    },
    test: {
        client: 'pg',
        version: '11.3',
        connection: {
            host: 'localhost',
            user: 'super_node',
            password: 'node@node',
            database: 'lux_test',
            port: '5432'
        },
        migrations: {
            directory: __dirname + '/migrations'
        },
        seeds: {
            directory: __dirname + '/seeds'
        }
    },
    ci: {
        client: 'pg',
        version: '11.3',
        connection: {
            host: 'postgres',
            user: 'super_node',
            password: 'node@node',
            database: 'lux_test',
            port: '5432'
        },
        migrations: {
            directory: __dirname + '/migrations'
        },
        seeds: {
            directory: __dirname + '/seeds'
        }
    },
    staging: {
        client: 'postgresql',
        connection: {
            host: '127.0.0.1',
            user: 'postgres',
            password: 'nodev1db',
            database: 'super_host',
            port: '3307'
        },
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            tableName: 'knex_migrations'
        }
    },
    production: {
        client: 'pg',
        version: '11.3',
        connection: {
            host: '127.0.0.1',
            user: 'postgres',
            password: 'nodev1db',
            database: 'super_host',
            port: '3307'
        },
        pool: {
            min: 2,
            max: 10
        },
        migrations: {
            tableName: 'knex_migrations'
        }
    },
    onUpdateTrigger: table => `
    CREATE TRIGGER ${table}_updated_at
    BEFORE UPDATE ON ${table}
    FOR EACH ROW
    EXECUTE PROCEDURE on_update_timestamp();`
};
