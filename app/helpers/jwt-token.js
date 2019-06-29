const jwt = require('njwt');
const config = require('../../config/config.js');
const { AuthenticationError } = require('./errors');
const randomstring = require('randomstring');

class TokenHandler {
    static validateToken(token) {
        const matchErrorMsg = 'Invalid Token';
        if (token.startsWith('Bearer')) {
            const decoded = jwt.verify(token.slice(7), config.JWT_SECRET);
            return Promise.resolve({
                ...decoded,
                token: token.slice(7)
            });
        }
        return Promise.reject(new AuthenticationError(matchErrorMsg, 401, '', []));
    }

    static generateJWT(user) {
        const now = new Date();
        const exp = new Date();
        exp.setDate(now.getDate() + 90);
        const accessJwt = jwt.create({
            sub: user.id,
            iat: Math.floor(now.getTime() / 1000)
        }, config.JWT_SECRET);

        const accessToken = accessJwt.compact();
        const refreshToken = randomstring.generate(30);

        const jti = accessJwt.body.jti;

        return {
            accessToken, refreshToken, exp, jti
        };
    }
}
module.exports = {
    TokenHandler
};
