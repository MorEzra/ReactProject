const vacationsDao = require("../dao/vacations-dao");
const hostUrl = "http://localhost:3001/";
let ServerError = require("../errors/server-error");
let ErrorType = require("../errors/error-type");

function getUserDetails(token) {
    let pureToken = token.split(" ").pop();

    let userCachedDetails = vacationsDao.getUserDetails(pureToken);

    return userCachedDetails;
}

function isAdmin(token) {
    let userCachedDetails = getUserDetails(token);
    let userType = userCachedDetails.userType;

    if (userType == "Admin") {
        return true;
    }
    return false;
}

async function getAllVacations(token) {
    let userCachedDetails = getUserDetails(token);
    let userId = userCachedDetails.id;

    let successfulVacationList = await vacationsDao.getAllVacations(userId);

    for (let vacation of successfulVacationList) {
        if (vacation.userId != userId) {
            vacation.isFavorite = false;
        } else {
            vacation.isFavorite = true;
        }

        vacation.picture = hostUrl + vacation.picture;
    }

    return successfulVacationList;
}

async function addVacation(vacation, token) {
    if (!isAdmin(token)) {
        throw new ServerError(ErrorType.ACCESS_DENIED);
    }

    validateInputFields(vacation);

    vacation.picture = vacation.picture.slice(hostUrl.length, vacation.picture.length);

    let newVacation = await vacationsDao.addVacation(vacation);

    newVacation.picture = hostUrl + newVacation.picture;

    return newVacation;
}

async function deleteVacation(vacationId, token) {
    if (!isAdmin(token)) {
        throw new ServerError(ErrorType.ACCESS_DENIED);
    }

    let pictureForDelete = await vacationsDao.getPictureForDelete(vacationId);

    await vacationsDao.deleteVacation(vacationId);

    return pictureForDelete;
}

async function followVacation(token, vacationId) {
    let userCachedDetails = getUserDetails(token);
    let userId = userCachedDetails.id;

    await vacationsDao.followVacation(userId, vacationId);
}

async function unfollowVacation(token, vacationId) {
    let userCachedDetails = getUserDetails(token);
    let userId = userCachedDetails.id;

    await vacationsDao.unfollowVacation(userId, vacationId);
}

async function updateVacation(vacation, token) {
    if (!isAdmin(token)) {
        throw new ServerError(ErrorType.ACCESS_DENIED);
    }

    validateInputFields(vacation);
    vacation.picture = vacation.picture.slice(hostUrl.length, vacation.picture.length);

    await vacationsDao.updateVacation(vacation);
}

async function getFollowedVacations(token) {
    if (!isAdmin(token)) {
        throw new ServerError(ErrorType.ACCESS_DENIED);
    }

    let followedVacations = await vacationsDao.getFollowedVacations();
    return followedVacations;
}

function validateInputFields(vacation) {
    if (vacation.destination.trim() == "" || vacation.description.trim() == "" || vacation.picture == "" || vacation.startDate == "" || vacation.endDate == "" || vacation.price == +"" || vacation.picture == "http://localhost:3001/no-image.jpg") {
        let message = "All fields must be filled!";
        ErrorType.INVALID_INPUT_FIELD.message = message;
        throw new ServerError(ErrorType.INVALID_INPUT_FIELD);
    }

    if (Date.parse(vacation.endDate) <= Date.parse(vacation.startDate)) {
        let message = "End date must be later than start date!";
        ErrorType.INVALID_INPUT_FIELD.message = message;
        throw new ServerError(ErrorType.INVALID_INPUT_FIELD);
    }

    if (vacation.destination.length < 2 ||
        vacation.description.length < 10) {
        let message = "some of the text fields you entered are too short!";
        ErrorType.INVALID_INPUT_FIELD.message = message;
        throw new ServerError(ErrorType.INVALID_INPUT_FIELD);
    }

    if (vacation.destination.length > 45 ||
        vacation.description.length > 1000) {
        let message = "some of the text fields you entered are too long!";
        ErrorType.INVALID_INPUT_FIELD.message = message;
        throw new ServerError(ErrorType.INVALID_INPUT_FIELD);
    }
}

module.exports = {
    isAdmin,
    addVacation,
    deleteVacation,
    getAllVacations,
    followVacation,
    unfollowVacation,
    updateVacation,
    getFollowedVacations
}