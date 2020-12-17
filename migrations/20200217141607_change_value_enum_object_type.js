
exports.up = (knex) => {
    return knex.schema.raw(`
      ALTER TABLE "event_logs"
      DROP CONSTRAINT "event_logs_object_type_check",
      ADD CONSTRAINT "event_logs_object_type_check"
      CHECK (object_type IN ('booking', 'payment', 'property'))
  `);
};

exports.down = (knex) => {
    return knex.schema.raw(`
      ALTER TABLE "event_logs"
      DROP CONSTRAINT "event_logs_object_type_check",
      ADD CONSTRAINT "event_logs_object_type_check"
      CHECK (object_type IN ('booking', 'payment'))
  `);
};
