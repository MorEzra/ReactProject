const express = require('express');
const vacationsLogic = require('../logic/vacations-logic');
const hostUrl = "http://localhost:3001/";

const router = express.Router();

//npm i --save multer
const multer = require('multer');
//npm i fs
const fs = require('fs');

router.get("/", async (request, response, next) => {
    let token = request.headers.authorization;

    try {
        let successfulVacationList = await vacationsLogic.getAllVacations(token)
        response.json(successfulVacationList)
    }
    catch (error) {
        return next(error)
    }
})

// * * picture upload
let storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads')
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
})

let upload = multer({ storage: storage }).single('file')

router.post('/upload', function (request, response) {
    let token = request.headers.authorization;
    if (!vacationsLogic.isAdmin(token)) {
        throw new ServerError(ErrorType.ACCESS_DENIED);
    }

    upload(request, response, function (error) {
        if (error instanceof multer.MulterError) {
            console.log(error);
            return;
        } else if (error) {
            console.log(error);
            return;
        }

        if (request.body.fileToDelete != undefined) {
            request.body.fileToDelete = request.body.fileToDelete.slice(hostUrl.length, request.body.fileToDelete.length);
            deletePicture(request.body.fileToDelete);
        }

        request.file.filename = hostUrl + request.file.filename;
        return response.status(200).send(request.file);
    })
});

//delete:
function deletePicture(pictureForDelete) {
    fs.unlinkSync("./uploads/" + pictureForDelete);
    console.log("File deleted");
}
// * *

router.post("/add", async (request, response, next) => {
    let token = request.headers.authorization;
    let vacation = request.body;

    try {
        let successfullNewVacation = await vacationsLogic.addVacation(vacation, token);
        response.json(successfullNewVacation);
    }
    catch (error) {
        return next(error)
    }
})

router.delete("/delete/:id", async (request, response, next) => {
    let token = request.headers.authorization;
    let vacationId = request.params.id;
    try {
        let pictureForDelete = await vacationsLogic.deleteVacation(vacationId, token);

        deletePicture(pictureForDelete);

        response.json()
    }
    catch (error) {
        return next(error)
    }
})

router.post("/follow/:id", async (request, response, next) => {
    let token = request.headers.authorization
    let vacationId = request.params.id;

    try {
        await vacationsLogic.followVacation(token, vacationId)
        response.json()
    }
    catch (error) {
        return next(error)
    }
})

router.delete("/unfollow/:id", async (request, response, next) => {
    let token = request.headers.authorization
    let vacationId = request.params.id

    try {
        await vacationsLogic.unfollowVacation(token, vacationId)
        response.json()
    }
    catch (error) {
        return next(error)
    }
})

router.put("/update", async (request, response, next) => {
    let token = request.headers.authorization;
    let vacation = request.body;

    try {
        await vacationsLogic.updateVacation(vacation, token);
        response.json()
    }
    catch (error) {
        return next(error)
    }
})

router.get("/followed", async (request, response, next) => {
    let token = request.headers.authorization;

    try {
        let successfullFollowedVacationsList = await vacationsLogic.getFollowedVacations(token);
        response.json(successfullFollowedVacationsList)
    }
    catch (error) {
        return next(error)
    }
})

module.exports = router;