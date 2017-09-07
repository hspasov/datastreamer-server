var mongoose = require("mongoose");
var StreamSessionModel = require("../models/streamSession");
var errorActions = require("../modules/errorActions");

var errorHandler = errorActions.errorHandler;
var validationError = errorActions.validationError;

function createNewStreamSession(request, response) {
    return StreamSessionModel.create({
        type: request.body.type,
        userId: request.body.userId
    }, function (error, streamSession) {
        if (error) {
            console.error("There was an error creating the stream session");
            console.error(error.code);
            console.error(error.name);
            if (error.name == "validationerror") {
                return validationError(error, response);
            }
            else {
                return errorHandler(error);
            }
        }
        console.log("New streamSession successfully created...");
        console.log(streamSession.userId);
        return response.json({
            msg: "Stream session created!",
            id: streamSession._id,
            userId: streamSession.userId
        });
    });
}

function findStreamSession(request, response) {
    return StreamSessionModel.findOne({ _id: mongoose.Types.ObjectId(request.body.id) }, "userId",
        function (error, streamSession) {
            if (error) {
                return errorHandler(error);
            }
            if (streamSession == null) {
                return response.json({
                    msg: "Stream session does not exist in the dBase"
                });
            }
            console.log(streamSession.userId);
            return response.json(streamSession);
        }
    );
}

function viewAllStreamSessions(request, response) {
    return StreamSessionModel.find({},
        function (error, streamSessions) {
            if (error) {
                return errorHandler(error);
            }
            console.log(streamSessions);
            return response.json(streamSessions);
        }
    );
}

function updateStreamSession(request, response) {
    return StreamSessionModel.findOne({ _id: mongoose.Types.ObjectId(request.body.id) },
        function (error, streamSession) {
            if (error) {
                return errorHandler(error);
            }
            console.log(stremSession);
            streamSession.userId = request.body.userId;
            streamSession.type = request.body.type;
            streamSession.save(function (error, streamSession) {
                if (error) {
                    return errorHandler(error);
                }
                console.log("Stream session updated: ", streamSession);
                return response.json(streamSession);
            });
        }
    );
}

function deleteStreamSession(request, response) {
    return StreamSessionModel.findOneAndRemove({ _id: mongoose.Types.ObjectId(request.body.id) },
        function (error, streamSession) {
            if (error) {
                return errorHandler(error);
            }
            console.log("Stream session deleted ", streamSession);
            return response.json(streamSession);
        }
    );
}

module.exports = {
    createNewStreamSession: createNewStreamSession,
    findStreamSession: findStreamSession,
    viewAllStreamSessions: viewAllStreamSessions,
    updateStreamSession: updateStreamSession,
    deleteStreamSession: deleteStreamSession
};