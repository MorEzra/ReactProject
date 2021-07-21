let connection = require('./connection-wrapper')
let ErrorType = require("./../errors/error-type");
let ServerError = require("./../errors/server-error");
let usersCache = require("../users-cache");

function getUserDetails(token) {
    let userCachedDetails = usersCache.getUserDetails(token);
    return userCachedDetails;
}

async function getAllVacations(userId) {
    let sql = `SELECT  v.vacation_id AS id, v.destination, v.description, v.picture, DATE_FORMAT(v.start_date, '%d/%m/%Y') AS startDate, DATE_FORMAT(v.end_date,'%d/%m/%Y') AS endDate, v.price, followed_vacations.user_id AS userId, 
    (SELECT COUNT(*) FROM followed_vacations 
    WHERE vacation_id = v.vacation_id) AS numOfFollowers
    FROM Vacations v
    LEFT JOIN followed_vacations ON v.vacation_id = followed_vacations.vacation_id && followed_vacations.user_id=?
    ORDER BY followed_vacations.user_id DESC`

    let parameters = [userId];

    let vacationListResult;
    try {
        vacationListResult = await connection.executeWithParameters(sql, parameters);
    }
    catch (error) {
        throw new ServerError(ErrorType.GENERAL_ERROR, sql, error)
    }

    // A functional (!) issue which means - the userName + password do not match
    if (vacationListResult == null || vacationListResult.length == 0) {
        throw new ServerError(ErrorType.NO_VACATIONS_DATA)
    }

    console.log("All good ! ")
    return vacationListResult;
}

async function addVacation(vacation) {
    let sql = "INSERT INTO Vacations (destination, description, picture, start_date, end_date, price) values(?, ?, ?, ?, ?, ?)";
    let parameters = [vacation.destination, vacation.description, vacation.picture, vacation.startDate, vacation.endDate, vacation.price];

    try {
        let response = await connection.executeWithParameters(sql, parameters);

        let newVacation = {
            id: response.insertId,
            destination: vacation.destination,
            description: vacation.description,
            picture: vacation.picture,
            startDate: vacation.startDate,
            endDate: vacation.endDate,
            price: vacation.price,
            isFavorite: false,
            numOfFollowers: 0
        }

        return newVacation;
    }
    catch (error) {
        throw new ServerError(ErrorType.GENERAL_ERROR, sql, error)
    }
}

async function getPictureForDelete(vacationId){
    let sql = `SELECT picture FROM Vacations WHERE vacation_id =?;`
    let parameters = [vacationId]

    try {
        let pictureForDelete = await connection.executeWithParameters(sql, parameters);
        return pictureForDelete[0].picture;
    }
    catch (error) {
        throw new ServerError(ErrorType.GENERAL_ERROR, sql, error)
    }
}

async function deleteVacation(vacationId) {
    let sql = `DELETE FROM followed_vacations WHERE vacation_id =?; DELETE FROM Vacations WHERE vacation_id =?;`
    let parameters = [vacationId, vacationId]

    try {
        await connection.executeWithParameters(sql, parameters)
    }
    catch (error) {
        throw new ServerError(ErrorType.GENERAL_ERROR, sql, error)
    }
}

async function followVacation(userId, vacationId) {
    let sql = "INSERT INTO followed_vacations (vacation_id, user_id) values(?, ?)";
    let parameters = [vacationId, userId];

    try {
        await connection.executeWithParameters(sql, parameters)
    }
    catch (error) {
        throw new ServerError(ErrorType.GENERAL_ERROR, sql, error)
    }
}

async function unfollowVacation(userId, vacationId) {
    let sql = "DELETE FROM followed_vacations WHERE vacation_id=? and user_id=?"
    let parameters = [vacationId, userId];

    try {
        await connection.executeWithParameters(sql, parameters)
    }
    catch (error) {
        throw new ServerError(ErrorType.GENERAL_ERROR, sql, error)
    }
}

async function updateVacation(vacation) {
    let sql = `UPDATE Vacations SET destination =?, description =?, picture =?, start_date =?, end_date =?, price =? WHERE vacation_id =?`
    let parameters = [vacation.destination, vacation.description, vacation.picture, vacation.startDate, vacation.endDate, vacation.price, vacation.id];

    try {
        await connection.executeWithParameters(sql, parameters)
    }
    catch (error) {
        throw new ServerError(ErrorType.GENERAL_ERROR, sql, error)
    }
}

async function getFollowedVacations() {
    let sql = `SELECT f.vacation_id AS id, COUNT(*) AS numOfFollowers, v.destination
    FROM followed_vacations f
    LEFT JOIN Vacations v
    ON v.vacation_id = f.vacation_id
    GROUP BY id
    HAVING COUNT(*)>=1`

    let followedVacations;

    try {
        followedVacations = await connection.execute(sql);
    }
    catch (error) {
        throw new ServerError(ErrorType.GENERAL_ERROR, sql, error)
    }

    // A functional (!) issue which means - the userName + password do not match
    if (followedVacations == null || followedVacations.length == 0) {
        throw new ServerError(ErrorType.NO_FOLLOWERS);
    }

    return followedVacations;
}

module.exports = {
    addVacation,
    deleteVacation,
    getPictureForDelete,
    getAllVacations,
    followVacation,
    unfollowVacation,
    updateVacation,
    getFollowedVacations,
    getUserDetails
}