const expressJwt = require('express-jwt');
const config = require('../config.json');

let { secret } = config;
// console.log(secret);

function authenticateJwtRequestToken() {
    return expressJwt({ secret , algorithms: ['HS256'] }).unless({
        path: [
            '/users/login',
            '/users/register',
            '/users/google-login'
        ]
    });
}

module.exports = authenticateJwtRequestToken;