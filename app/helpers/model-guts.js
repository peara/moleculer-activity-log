'use strict';

module.exports = ({
    knex = {},
    name = 'name',
    tableName = 'tablename',
    selectableProps = [],
    timeout = 1000
}) => {
    const create = props => {
        return knex.insert(props)
            .returning(selectableProps)
            .into(tableName)
            .timeout(timeout);
    };

    const findAll = () => knex.select(selectableProps)
        .from(tableName)
        .timeout(timeout);

    const find = filters => knex.select(selectableProps)
        .from(tableName)
        .where(filters)
        .timeout(timeout);

    // Same as `find` but only returns the first match if >1 are found.
    const findOne = filters => find(filters)
        .then(results => {
            if (!Array.isArray(results)) return results;

            return results[0];
        });

    const findById = id => knex.select(selectableProps)
        .from(tableName)
        .where({ id })
        .timeout(timeout);

    const update = (id, props) => {
        return knex.update(props)
            .from(tableName)
            .where({ id })
            .returning(selectableProps)
            .timeout(timeout);
    };

    const destroy = id => knex.del()
        .from(tableName)
        .where({ id })
        .timeout(timeout);

    const destroyWithParams = filters =>{
        knex.del()
            .from(tableName)
            .where(filters)
            .timeout(timeout);
    };

    return {
        name,
        tableName,
        selectableProps,
        timeout,
        create,
        findAll,
        find,
        findOne,
        findById,
        update,
        destroy,
        destroyWithParams
    };
};
