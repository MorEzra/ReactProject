let ErrorType = require("./errors/error-type");
let ServerError = require("./errors/server-error");

const usersCache = new Map();

function getUserDetails(token) {
    if (usersCache.has(token)) {
        let userCachedDetails = usersCache.get(token);
        return userCachedDetails;
    } else {
        throw new ServerError(ErrorType.INVALID_TOKEN)
    }
}

function deleteUserFromCache(token) {
    if (usersCache.has(token)) {
        usersCache.delete(token)
    } else {
        throw new ServerError(ErrorType.INVALID_TOKEN);
    }
}

function saveDataForCache(token, userData){
    usersCache.set(token, userData);
}

module.exports = {
    usersCache,
    getUserDetails,
    saveDataForCache,
    deleteUserFromCache
}