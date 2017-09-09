var mongoose = require("mongoose");
var StreamSessionModel = require("../models/streamSession");
var errorActions = require("../modules/errorActions");

var errorHandler = errorActions.errorHandler;
var validationError = errorActions.validationError;

function createNewStreamSession(socketId, type, providerId, done) {
    return StreamSessionModel.create({
        socketId: socketId,
        type: type,
        providerId: providerId
    }, function (error, streamSession) {
        if (error) {
            console.error("There was an error creating the stream session");
            console.error(error.code);
            console.error(error.name);
            if (error.name == "validationerror") {
                return done(validationError(error, response), null);
            }
            else {
                return done(errorHandler(error), null);
            }
        }
        console.log("New streamSession successfully created...");
        console.log(streamSession.providerId);
        return done(null, {
            msg: "Stream session created!",
            socketId: streamSession.socketId,
            providerId: streamSession.providerId,
            type: streamSession.type
        });
    });
}

function findStreamSessions(type, providerId, done) {
    return StreamSessionModel.find({ type: type, providerId: providerId },
        function (error, streamSessions) {
            if (error) {
                return done(errorHandler(error), null);
            }
            return done(null, streamSessions);
        }
    );
}

function viewAllStreamSessions(request, response) {
    return StreamSessionModel.find({},
        function (error, streamSessions) {
            if (error) {
                return errorHandler(error);
            }
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

function deleteStreamSession(socketId, done) {
    return StreamSessionModel.findOneAndRemove({ socketId: socketId },
        function (error, streamSession) {
            if (error) {
                return done(errorHandler(error), null);
            }
            console.log("Stream session deleted ", streamSession);
            return done(null, streamSession);
        }
    );
}

module.exports = {
    createNewStreamSession: createNewStreamSession,
    findStreamSessions: findStreamSessions,
    viewAllStreamSessions: viewAllStreamSessions,
    updateStreamSession: updateStreamSession,
    deleteStreamSession: deleteStreamSession
};