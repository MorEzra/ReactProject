let usersDao = require("../dao/users-dao");
const config = require('../config.json');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
let ServerError = require("../errors/server-error");
let ErrorType = require("../errors/error-type");

//for google login
const { OAuth2Client } = require("google-auth-library");
const GoogleClient = new OAuth2Client("219385968064-tml33i2rpnef1cdkmaakmddp1bvq1g7i.apps.googleusercontent.com");

//for hash use
const saltRight = "sdkjfhdskajh";
const saltLeft = "--mnlcfs;@!$ ";

function createHashPassword(password) {
    password = crypto.createHash("md5").update(saltLeft + password + saltRight).digest("hex");
    return password;
}

function generateToken(userData) {
    const token = jwt.sign({ sub: userData.username }, config.secret);
    return token;
}

function createSuccessfullLoginResponse(token, userData) {
    let successfullLoginResponse = { token: token, userType: userData.userType, username: userData.firstName };
    return successfullLoginResponse;
}

async function addUser(user) {
    validateInputFields(user);

    //validations
    if (await usersDao.isUserExistByUsername(user.username)) {
        throw new ServerError(ErrorType.USER_NAME_ALREADY_EXIST);
    }

    user.password = createHashPassword(user.password);

    let userRegisterData = await usersDao.addUser(user);

    const token = generateToken(userRegisterData);

    usersDao.saveDataForCache(token, userRegisterData);

    let successfullRegisterResponse = createSuccessfullLoginResponse(token, userRegisterData);
    return successfullRegisterResponse;
}

async function login(user) {
    if (user.username.trim() == "" || user.password.trim() == "") {
        let message = "All fields must be filled!";
        ErrorType.INVALID_INPUT_FIELD.message = message;
        throw new ServerError(ErrorType.INVALID_INPUT_FIELD);
    }

    user.password = createHashPassword(user.password);

    let userLoginData = await usersDao.login(user);

    const token = generateToken(userLoginData);

    usersDao.saveDataForCache(token, userLoginData);

    let successfullLoginResponse = createSuccessfullLoginResponse(token, userLoginData);
    return successfullLoginResponse;
}

async function googleLogin(tokenId) {
    let response = await GoogleClient.verifyIdToken({ idToken: tokenId, audience: "219385968064-tml33i2rpnef1cdkmaakmddp1bvq1g7i.apps.googleusercontent.com" })

    const { email_verified, given_name, family_name, email } = response.payload;

    if (email_verified) {
        let googleUserLoginData;
        if (await usersDao.isUserExistByUsername(email)) {
            googleUserLoginData = await usersDao.googleLogin(email);

        } else {
            let password = createHashPassword(email);
            let user = {
                firstName: given_name,
                surname: family_name,
                username: email,
                password: password
            }
            googleUserLoginData = await usersDao.addUser(user);
        }
        let token = generateToken(googleUserLoginData);

        usersDao.saveDataForCache(token, googleUserLoginData);
        let successfulLoginResponse = createSuccessfullLoginResponse(token, googleUserLoginData);
        return successfulLoginResponse;
    } else {
        throw new ServerError(ErrorType.UNAUTHORIZED);
    }

}

function getUserDetails(token) {
    let pureToken = token.split(" ").pop()

    let userDetails = usersDao.getUserDetails(pureToken);

    return userDetails;
}

function deleteUserFromCache(token) {
    let pureToken = token.split(" ").pop()

    usersDao.deleteUserFromCache(pureToken);
}

function validateInputFields(user) {
    if (user.firstName.trim() == "" || user.surname.trim() == "" || user.username.trim() == "" || user.password.trim() == "") {
        let message = "All fields must be filled!";
        ErrorType.INVALID_INPUT_FIELD.message = message;
        throw new ServerError(ErrorType.INVALID_INPUT_FIELD);
    }

    if (user.firstName.length > 20 || user.surname.length > 20 || user.username.length > 20 || user.password.length > 20) {
        let message = "Fields can include max 20 characters";
        ErrorType.INVALID_INPUT_FIELD.message = message;
        throw new ServerError(ErrorType.INVALID_INPUT_FIELD);
    }

    if (user.password.length < 6) {
        let message = "Password must include at least 6 characters";
        ErrorType.INVALID_INPUT_FIELD.message = message;
        throw new ServerError(ErrorType.INVALID_INPUT_FIELD);
    }
}

module.exports = {
    addUser,
    login,
    googleLogin,
    getUserDetails,
    deleteUserFromCache
}