var mongoose = require("mongoose");
var ClientSessionModel = require("../models/clientSession");
var errorActions = require("../modules/errorActions");

var errorHandler = errorActions.errorHandler;
var validationError = errorActions.validationError;

function createNewClientSession(socketId, providerIds, done) {
    return ClientSessionModel.create({
        socketId: socketId,
        providerIds: providerIds
    }, function (error, clientSession) {
        if (error) {
            console.error("There was an error creating the client session");
            console.error(error.code);
            console.error(error.name);
            if (error.name == "validationerror") {
                return done(validationError(error), null);
            }
            else {
                return done(errorHandler(error), null);
            }
        }
        console.log("New client session successfully created...");
        console.log(clientSession.socketId);
        return done(null, {
            socketId: clientSession.socketId,
            providerIds: clientSession.providerIds
        });
    });
}

function findClientSessionsByProviderId(providerId, done) {
    return ClientSessionModel.find({ providerIds: providerId },
        function (error, clientSessions) {
            if (error) {
                return done(errorHandler(error), null);
            }
            return done(null, clientSessions);
        }
    );
}

function findClientSession(socketId, done) {
    return ClientSessionModel.find({ socketId: socketId },
        function (error, clientSessions) {
            if (error) {
                return done(errorHandler(error), null);
            } else if (clientSessions.length > 1) {
                return (done(errorHandler("Error: Multiple clients with same id found in database!"), null));
            } else if (clientSessions.length == 0) {
                return done(null, null);
            } else if (clientSessions.length == 1) {
                return done(null, clientSessions[0]);
            }
            return done("Error: Invalid state", clientSession);
        }
    );
}

function viewAllClientSessions(request, response) {
    return ClientSessionModel.find({},
        function (error, clientSessions) {
            if (error) {
                return errorHandler(error);
            }
            return response.json(clientSessions);
        }
    );
}

function updateClientSession(socketId, providerIds, done) {
    return ClientSessionModel.findOne({ socketId: socketId },
        function (error, clientSession) {
            if (error) {
                return done(errorHandler(error), null);
            }
            clientSession.socketId = socketId;
            clientSession.providerIds = providerIds;
            clientSession.save(function (error, clientSession) {
                if (error) {
                    return done(errorHandler(error), null);
                }
                console.log("Client session updated: ", clientSession);
                return done(null, clientSession);
            });
        }
    );
}

function removeProviderFromClient(providerId, clientSocketId, done) {
    return ClientSessionModel.findOneAndUpdate(
        { socketId: clientSocketId },
        { $pull: { providerIds: providerId } },
        function (error, client) {
            if (error) {
                return done(error, null);
            } else {
                return done(null, client);
            }
        }
    );
}

function addProviderToClient(providerId, clientSocketId, done) {
    return CLientSessionModel.findOneAndUpdate(
        { socketId: clientSocketId },
        { $push: { providerIds: providerId } },
        function (error, client) {
            if (error) {
                return done(error, null);
            } else {
                return done(null, client);
            }
        }
    );
}

function deleteClientSession(socketId, done) {
    return ClientSessionModel.findOneAndRemove({ socketId: socketId },
        function (error, clientSession) {
            if (error) {
                return done(errorHandler(error), null);
            }
            console.log("Client session deleted ", clientSession);
            return done(null, clientSession);
        }
    );
}

module.exports = {
    createNewClientSession: createNewClientSession,
    findClientSession: findClientSession,
    findClientSessionsByProviderId: findClientSessionsByProviderId,
    viewAllClientSessions: viewAllClientSessions,
    updateClientSession: updateClientSession,
    addProviderToClient: addProviderToClient,
    removeProviderFromClient: removeProviderFromClient,
    deleteClientSession: deleteClientSession
};