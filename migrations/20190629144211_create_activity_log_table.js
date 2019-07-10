const { onUpdateTrigger } = require('../knexfile');

exports.up = (knex, Promise) => {
    return knex.schema.createTable('activity_logs', (table) => {
        table.increments();
        table.string('changes');
        table.string('action').notNullable();
        table.integer('actor_id').unsigned().notNullable();
        table.string('actor_type').notNullable();
        table.integer('object_id').unsigned();
        table.string('object_type');
        table.timestamp('created_at').notNullable().defaultTo(knex.raw('now()'));
        table.timestamp('updated_at').notNullable().defaultTo(knex.raw('now()'));
        table.timestamp('deleted_at');
    }).then(() => knex.raw(onUpdateTrigger('activity_logs')));
};

exports.down = (knex, Promise) => {
    return knex.raw('DROP TABLE activity_logs CASCADE');
};
