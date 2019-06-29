'use strict';

const { MoleculerError } = require('moleculer').Errors;
class AuthenticationError extends MoleculerError {
    constructor(message, code, type, data) {
        super();
        this.code = 401;
        this.message = message;
        this.type = type;
        this.data = data;
    }
}
module.exports = {
    AuthenticationError
};
