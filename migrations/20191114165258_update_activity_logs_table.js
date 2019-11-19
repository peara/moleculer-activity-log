exports.up = (knex) => {
    return knex.schema.alterTable('activity_logs', table => {
        table.integer('actor_id').unsigned().nullable().alter();
        table.jsonb('object');
        table.integer('version').notNullable();
        table.unique(['object_type', 'object_id', 'version']);
    });
};

exports.down = (knex) => {
    return knex.schema.alterTable('activity_logs', table => {
        table.integer('actor_id').unsigned().notNullable().alter();
        table.dropColumn('object');
        table.dropColumn('version');
    });
};
