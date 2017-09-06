var SessionModel = require("../models/session");
var errorActions = require("../modules/errorActions");

var errorHandler = errorActions.errorHandler;
var validationError = errorActions.validationError;

function createNewSession(request, response) {
    return SessionModel.create({
        type: request.body.type,
        userId: request.body.userId
    }, function (error, session) {
        if (error) {
            console.error("There was an error creating the session");
            console.error(error.code);
            console.error(error.name);
            if (error.name == "validationerror") {
                return validationError(error, response);
            }
            else {
                return errorHandler(error);
            }
        }
        console.log("New session successfully created...");
        console.log(session.userId);
        return response.json({
            msg: "Session created!",
            id: session._id,
            userId: session.userId
        });
    });
}

function findSession(request, response) {
    return SessionModel.findOne({ userId: request.params.userId }, "userId",
        function (error, session) {
            if (error) {
                return errorHandler(error);
            }
            if (session == null) {
                return response.json({
                    msg: "Session does not exist in the dBase"
                });
            }
            console.log(session.userId);
            return response.json(session);
        }
    );
}

function viewAllSessions(request, response) {
    return SessionModel.find({},
        function (error, sessions) {
            if (error) {
                return errorHandler(error);
            }
            console.log(sessions);
            return response.json(sessions);
        }
    );
}

function updateSession(request, response) {
    return SessionModel.findOne({ userId: request.params.userId },
        function (error, session) {
            if (error) {
                return errorHandler(error);
            }
            console.log(session);
            session.userId = request.body.userId;
            session.type = request.body.type;
            session.save(function (error, session) {
                if (error) {
                    return errorHandler(error);
                }
                console.log("Session updated: ", session);
                return response.json(session);
            });
        }
    );
}

function deleteSession(request, response) {
    return SessionModel.findOneAndRemove({ userId: request.params.userId },
        function (error, session) {
            if (error) {
                return errorHandler(error);
            }
            console.log("Session deleted ", session);
            return response.json(session);
        }
    );
}

module.exports = {
    createNewSession: createNewSession,
    findSession: findSession,
    viewAllSessions: viewAllSessions,
    updateSession: updateSession,
    deleteSesion: deleteSession
};