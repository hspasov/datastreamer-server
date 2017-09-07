var express = require("express");
var router = express.Router();
var path = require("path");
var errorActions = require("../modules/errorActions");
var sessionActions = require("../actions/session");

var errorHandler = errorActions.errorHandler;
var validationError = errorActions.validationError;

var createNewSession = sessionActions.createNewSession;
var findSession = sessionActions.findSession;
var viewAllSessions = sessionActions.viewAllSessions;
var updateSession = sessionActions.updateSession;
var deleteSession = sessionActions.deleteSession;

router.post("/new", function (request, response) {
    return createNewSession(request, response)
});

router.post("/end", function (request, response) {
    return deleteSession(request, response)
});

module.exports = router;