const { onUpdateTrigger } = require('../knexfile');

exports.up = knex => {
    return knex.schema.createTable('event_logs', table => {
        table.increments();
        table.integer('actor_id');
        table.enu('actor_type', ['admin', 'host', 'user', 'system']).notNullable();
        table.index(['actor_type', 'actor_id'], 'actor');

        table.integer('object_id').notNullable();
        table.enu('object_type', ['booking', 'payment']).notNullable();
        table.index(['object_type', 'object_id'], 'object');

        table.string('event_name').notNullable().index();
        table.string('note');
        table.jsonb('changes').notNullable();

        table.timestamp('created_at').notNullable().defaultTo(knex.raw('now()'));
        table.timestamp('updated_at').notNullable().defaultTo(knex.raw('now()'));
    }).then(() => knex.raw(onUpdateTrigger('event_logs')));
};

exports.down = knex => {
    return knex.schema.dropTable('event_logs');
};
