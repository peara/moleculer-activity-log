exports.up = (knex) => {
    return knex.schema.alterTable('activity_logs', table => {
        table.bigInteger('version').notNullable().alter();
    }).then(() => {
        return knex.raw('update activity_logs set version = version * 1000 where version > 1000000');
    });
};

exports.down = (knex) => {
    return knex.raw('update activity_logs set version = version / 1000 where version > 1000000')
        .then(() => {
            return knex.schema.alterTable('activity_logs', table => {
                table.integer('version').notNullable().alter();
            });
        });
};
