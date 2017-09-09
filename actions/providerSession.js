var mongoose = require("mongoose");
var ProviderSessionModel = require("../models/providerSession");
var errorActions = require("../modules/errorActions");

var errorHandler = errorActions.errorHandler;
var validationError = errorActions.validationError;

function createNewProviderSession(socketId, providerId, clientSocketIds, done) {
    return ProviderSessionModel.create({
        socketId: socketId,
        providerId: providerId,
        clientSocketIds: clientSocketIds
    }, function (error, providerSession) {
        if (error) {
            console.error("There was an error creating the provider session");
            console.error(error.code);
            console.error(error.name);
            if (error.name == "validationerror") {
                return done(validationError(error), null);
            }
            else {
                return done(errorHandler(error), null);
            }
        }
        console.log("New provider session successfully created...");
        console.log(providerSession.providerId);
        return done(null, {
            socketId: providerSession.socketId,
            providerId: providerSession.providerId,
            clientSocketIds: providerSession.clientSocketIds
        });
    });
}

function findProviderSessionByProviderId(providerId, done) {
    return ProviderSessionModel.find({ providerId: providerId },
        function (error, providerSessions) {
            if (error) {
                return done(errorHandler(error), null);
            } else if (providerSessions.length > 1) {
                return (done(errorHandler("Error: Multiple providers with same id found in database!"), null));
            } else if (providerSessions.length == 0) {
                return done(null, null);
            } else if (providerSessions.length == 1) {
                return done(null, providerSessions[0]);
            }
            return done("Error: Invalid state", providerSessions);
        }
    );
}

function findProviderSessionBySocketId(socketId, done) {
    return ProviderSessionModel.find({ socketId: socketId },
        function (error, providerSessions) {
            if (error) {
                return done(errorHandler(error), null);
            } else if (providerSessions.length > 1) {
                return (done(errorHandler("Error: Multiple providers with same id found in database!"), null));
            } else if (providerSessions.length == 0) {
                return done(null, null);
            } else if (providerSessions.length == 1) {
                return done(null, providerSessions[0]);
            }
            return done("Error: Invalid state", providerSessions);
        }
    );
}

function viewAllProviderSessions(request, response) {
    return ProviderSessionModel.find({},
        function (error, providerSessions) {
            if (error) {
                return errorHandler(error);
            }
            return response.json(providerSessions);
        }
    );
}

function updateProviderSession(socketId, providerId, clientSocketIds, done) {
    return ProviderSessionModel.findOne({ socketId: socketId },
        function (error, providerSession) {
            if (error) {
                return done(errorHandler(error), null);
            }
            providerSession.socketId = socketId;
            providerSession.providerId = providerId;
            providerSession.clientSocketIds = clientSocketIds;
            providerSession.save(function (error, providerSession) {
                if (error) {
                    return done(errorHandler(error), null);
                }
                console.log("Provider session updated: ", providerSession);
                return done(null, providerSession);
            });
        }
    );
}

function removeClientFromProvider(providerId, clientSocketId, done) {
    return ProviderSessionModel.findOneAndUpdate(
        { providerId: providerId },
        { $pull: { clientSocketIds: clientSocketId } },
        function (error, provider) {
            if (error) {
                return done(error, null);
            } else {
                return done(null, provider);
            }
        }
    );
}

function addClientToProvider(providerId, clientSocketId, done) {
    return ProviderSessionModel.findOneAndUpdate(
        { providerId: providerId },
        { $push: { clientSocketIds: clientSocketId } },
        function (error, provider) {
            if (error) {
                return done(error, null);
            } else {
                console.log("addClientToProvider, on return:", provider);
                return done(null, provider);
            }
        }
    );
}

function deleteProviderSession(socketId, done) {
    return ProviderSessionModel.findOneAndRemove({ socketId: socketId },
        function (error, providerSession) {
            if (error) {
                return done(errorHandler(error), null);
            }
            console.log("Provider session deleted ", providerSession);
            return done(null, providerSession);
        }
    );
}

module.exports = {
    createNewProviderSession: createNewProviderSession,
    findProviderSessionByProviderId: findProviderSessionByProviderId,
    findProviderSessionBySocketId: findProviderSessionBySocketId,
    viewAllProviderSessions: viewAllProviderSessions,
    updateProviderSession: updateProviderSession,
    removeClientFromProvider: removeClientFromProvider,
    addClientToProvider: addClientToProvider,
    deleteProviderSession: deleteProviderSession
};