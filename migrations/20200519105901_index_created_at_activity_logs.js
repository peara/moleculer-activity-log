exports.up = (knex) => {
    return knex.schema.alterTable('activity_logs', table => {
        table.index('created_at');
    });
};

exports.down = (knex) => {
    return knex.schema.alterTable('activity_logs', table => {
        table.dropIndex('created_at');
    });
};
