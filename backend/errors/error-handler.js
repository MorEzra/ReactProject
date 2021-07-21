let errorHandler = (error, request, response, next) => {
    if (error.errorType !== undefined) {
        if (error.errorType.isShowStackTrace) {
            console.log(error);
        }

        response.status(error.errorType.httpCode).json({ error: error.errorType.message });
        return;
    }

    console.log(error);
    response.status(700).json({ error: 'A General Error Has Occurred' });
}

module.exports = errorHandler;