'use strict';

const createGuts = require('../helpers/model-guts.js');
const { TokenHandler } = require('../helpers/jwt-token');
const name = 'Jwt';
const tableName = 'jwts';

// Properties that are allowed to be selected from the database for reading.
// (e.g., `password` is not included and thus cannot be selected)
const selectableProps = [
    'id',
    'user_id',
    'jti'
];

module.exports = knex => {
    const guts = createGuts({
        knex,
        name,
        tableName,
        selectableProps
    });

    const create = (data) =>{
        return guts.create({
            user_id: data.user.id,
            jti: data.token.jti,
            refresh_token: data.token.refreshToken
        });
    };

    const logout = (token) => {
        return knex(tableName)
            .where('jti', token.jti)
            .del();
    };

    const validateToken = (token) => {
        return TokenHandler.validateToken(token);
    };

    return {
        ...guts,
        create,
        logout,
        validateToken
    };
};
