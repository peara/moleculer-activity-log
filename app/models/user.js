'use strict';

const bcrypt = require('bcrypt');
const createGuts = require('../helpers/model-guts.js');
const { AuthenticationError } = require('../helpers/errors');
const { TokenHandler } = require('../helpers/jwt-token');
const name = 'User';
const tableName = 'users';

// Properties that are allowed to be selected from the database for reading.
// (e.g., `password` is not included and thus cannot be selected)
const selectableProps = [
    'id',
    'email',
    'first_name',
    'last_name'
];

// Bcrypt functions used for hashing password and later verifying it.
const SALT_ROUNDS = 10;
const encryptPassword = password => bcrypt.hash(password, SALT_ROUNDS);
const verifyPassword = (password, hash) => bcrypt.compare(password, hash);

const beforeSave = user => {
    if (!user.password) return Promise.resolve(user);

    return encryptPassword(user.password)
        .then(hash => ({
            ...user,
            password: hash
        }))
        .catch(err => `Error hashing password: ${ err }`);
};

module.exports = knex => {
    const guts = createGuts({
        knex,
        name,
        tableName,
        selectableProps
    });

    const create = props => beforeSave(props)
        .then(user => guts.create(user));

    const login = (ctx) => {
        const matchErrorMsg = 'Email or password do not match';
        const props = ['id', 'first_name', 'last_name', 'email', 'password'];

        return knex.select(props)
            .from(tableName)
            .where({ email: ctx.email })
            .whereNull('deleted_at')
            .first()
            .then(user => {
                if (!user) return Promise.reject(new AuthenticationError('Email or password is invalid!', 401, '', []));
                return user;
            })
            .then((user) => Promise.all([user, verifyPassword(ctx.password, user.password)]))
            .then(([user, isMatch]) => {
                if (!isMatch) return Promise.reject(new AuthenticationError(matchErrorMsg, 401, '', []));
                // Create token
                let token = TokenHandler.generateJWT(user);
                // Return data
                return {
                    user: {
                        id: user.id,
                        first_name: user.first_name,
                        last_name: user.last_name,
                        email: user.email
                    },
                    token
                };
            });
    };
    const validateToken = (token)=>{
        return TokenHandler.validateToken(token);
    };
    const hashPassword = (password)=>{
        return encryptPassword(password);
    };
    const checkPassword = async (id, password)=>{
        const user = await knex.select(['password'])
            .from(tableName)
            .where({ id })
            .whereNull('deleted_at')
            .first();
        if (user) {
            const verify = await verifyPassword(password, user.password);
            if (verify) return true;

            return false;
        }
        return false;
    };
    return {
        ...guts,
        create,
        login,
        validateToken,
        hashPassword,
        checkPassword

    };
};
