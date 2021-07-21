let ErrorType = {
    GENERAL_ERROR: { id: 1, httpCode: 600, message: "Oops, something went wrong...Please try again", isShowStackTrace: true },
    USER_NAME_ALREADY_EXIST: { id: 2, httpCode: 601, message: "User name already exist", isShowStackTrace: false },
    UNAUTHORIZED: { id: 3, httpCode: 401, message: "Login failed, invalid username or password", isShowStackTrace: false },
    NO_VACATIONS_DATA: { id: 4, httpCode: 500, message: "COVID-19 is here, אין יותר מועדונים", isShowStackTrace: true },
    NO_FOLLOWERS: { id: 5, httpCode: 410, message: "There are no followed vacations right now", isShowStackTrace: false },
    INVALID_TOKEN: { id: 6, httpCode: 403, message: "Oops, something went wrong...try re-logging", isShowStackTrace: false },
    INVALID_INPUT_FIELD: { id: 7, httpCode: 400, message: "Some of the input fields are incorrect, please fix", isShowStackTrace: false },
    ACCESS_DENIED: { id: 8, httpCode: 401, message: "You are unauthorized for this kind of action.", isShowStackTrace: false },
}

module.exports = ErrorType;