const express = require('express');
const usersLogic = require('../logic/users-logic');
const router = express.Router();

//Login
router.post("/login", async (request, response, next) => {
    let user = request.body;

    try {
        let successfullLoginData = await usersLogic.login(user);
        response.json(successfullLoginData);
    }
    catch (error) {
        return next(error);
    }
});

//Login with google (Indian accent)
router.post("/google-login", async (request, response, next) => {

    let { tokenId } = request.body;

    try {
        let successfulLoginData = await usersLogic.googleLogin(tokenId);
        response.json(successfulLoginData);
    }
    catch (error) {
        return next(error);
    }
})

//Register
router.post("/register", async (request, response, next) => {
    let user = request.body;

    try {
        let successfullRegisterData = await usersLogic.addUser(user);
        response.json(successfullRegisterData);
    }
    catch (error) {
        return next(error)
    }
})

router.get("/details", async (request, response, next) => {
    let token = request.headers.authorization;

    try {
        let successfullUserDetails = await usersLogic.getUserDetails(token);
        response.json(successfullUserDetails);
    }
    catch (error) {
        return next(error)
    }
})

router.post("/logout", async (request, response, next) => {
    let token = request.headers.authorization

    try {
        await usersLogic.deleteUserFromCache(token);
        response.json()
    }
    catch (error) {
        return next(error)
    }
})

module.exports = router;