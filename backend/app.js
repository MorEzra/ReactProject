const express = require("express");
const server = express();

const usersController = require("./controllers/users-controller");
const vacationsController = require("./controllers/vacations-controller");
const loginFilter = require('./middlewares/login-filter');
const handleSocketsIO = require('./socketIO-handler');

const ErrorType = require("./errors/error-type");
const ServerError = require("./errors/server-error");
const errorHandler = require("./errors/error-handler");

const cors = require('cors');

server.use(express.static('./uploads'));

handleSocketsIO(server);

//we define cors here, therefore, we don't need to handle input validations on server side
server.use(cors({ origin: "http://localhost:3000", credentials: true }));

server.use(express.json());

server.use(loginFilter());

server.use(function (err, req, res, next) {
    if (401 == err.status) {
        console.log(err.status);
        throw new ServerError(ErrorType.INVALID_TOKEN);
    }
});

server.use("/users", usersController);
server.use("/vacations", vacationsController);
server.use(errorHandler);

server.listen(3001, () => console.log(`Listening on http://localhost:3001`));