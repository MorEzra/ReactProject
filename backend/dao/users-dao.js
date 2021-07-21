let connection = require("./connection-wrapper");
let ErrorType = require("./../errors/error-type");
let ServerError = require("./../errors/server-error");
let usersCache = require("../users-cache");

let saveDataForCache = (token, userData) => {
    usersCache.saveDataForCache(token, userData);
}

function getUserDetails(token) {
    let userCachedDetails = usersCache.getUserDetails(token);

    let userDetails = {
        userType: userCachedDetails.userType,
        id: userCachedDetails.id
    }

    return userDetails;
}

function deleteUserFromCache(token) {
    usersCache.deleteUserFromCache(token);
}

async function getUserByUsername(username) {
    let sql = "SELECT user_id as id, first_name as firstName, surname, username, password, user_type as userType FROM Users where username =?";
    let parameters = [username];

    let userLoginResult;
    try {
        userLoginResult = await connection.executeWithParameters(sql, parameters);
        return userLoginResult;
    }
    catch (error) {
        throw new ServerError(ErrorType.GENERAL_ERROR, sql, error);
    }
}

async function isUserExistByUsername(username) {
    let userLoginResult = await getUserByUsername(username)

    if (userLoginResult == null || userLoginResult.length == 0) {
        return false;
    }
    return true;
}

async function addUser(user) {
    let sql = "INSERT INTO Users (first_name, surname, username, password) values(?, ?, ?, ?)";
    let parameters = [user.firstName, user.surname, user.username, user.password];

    try {
        let response = await connection.executeWithParameters(sql, parameters);

        let newUser = {
            id: response.insertId,
            firstName: user.firstName,
            surname: user.surname,
            username: user.username,
            password: user.password,
            userType: 'Client'
        }

        return newUser;
    }
    catch (error) {
        throw new ServerError(ErrorType.GENERAL_ERROR, sql, error);
    }
}

async function login(user) {
    let sql = "SELECT user_id as id, first_name as firstName, surname, username, password, user_type as userType FROM Users WHERE username =? and password =?";
    let parameters = [user.username, user.password];
    let userLoginResult;
    try {
        userLoginResult = await connection.executeWithParameters(sql, parameters);
    }
    catch (error) {
        throw new ServerError(ErrorType.GENERAL_ERROR, sql, error);
    }

    if (userLoginResult == null || userLoginResult.length == 0) {
        throw new ServerError(ErrorType.UNAUTHORIZED);
    }

    console.log("All good ! ")
    return userLoginResult[0];
}

async function googleLogin(email) {
    let sql = "SELECT user_id as id, first_name as firstName, surname, username, password, user_type as userType FROM Users WHERE username =?";
    let parameters = [email];

    let userLoginResult;
    try {
        userLoginResult = await connection.executeWithParameters(sql, parameters);
    }
    catch (error) {
        throw new ServerError(ErrorType.GENERAL_ERROR, sql, error);
    }

    // A functional (!) issue which means - the userName + password do not match
    if (userLoginResult == null || userLoginResult.length == 0) {
        throw new ServerError(ErrorType.UNAUTHORIZED);
    }

    console.log("All good ! ")
    return userLoginResult[0];
}

module.exports = {
    login,
    googleLogin,
    isUserExistByUsername,
    addUser,
    saveDataForCache,
    getUserDetails,
    deleteUserFromCache
}