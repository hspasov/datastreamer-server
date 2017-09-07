var express = require("express");
var router = express.Router();
var path = require("path");
var errorActions = require("../modules/errorActions");
var streamSessionActions = require("../actions/streamSession");

var errorHandler = errorActions.errorHandler;
var validationError = errorActions.validationError;

var createNewStreamSession = streamSessionActions.createNewStreamSession;
var findStreamSession = streamSessionActions.findStreamSession;
var viewAllStreamSessions = streamSessionActions.viewAllStreamSessions;
var updateStreamSession = streamSessionActions.updateStreamSession;
var deleteStreamSession = streamSessionActions.deleteStreamSession;

router.post("/new", function (request, response) {
    return createNewStreamSession(request, response)
});

router.post("/end", function (request, response) {
    return deleteStreamSession(request, response)
});

module.exports = router;