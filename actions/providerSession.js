const mongoose = require("mongoose");
const ProviderSessionModel = require("../models/providerSession");
const errorActions = require("../modules/errorActions");

const errorHandler = errorActions.errorHandler;
const validationError = errorActions.validationError;

function createNewProviderSession(socketId, providerId, clientSocketIds, done) {
    return ProviderSessionModel.create({
        socketId: socketId,
        providerId: providerId,
        clientSocketIds: clientSocketIds
    }, (error, providerSession) => {
        if (error) {
            console.error("There was an error creating the provider session");
            console.error(error.code);
            console.error(error.name);
            return (error.name == "validationerror") ?
                done(validationError(error), null) : done(errorHandler(error), null);
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
        (error, providerSessions) => {
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
        (error, providerSessions) => {
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

/*function viewAllProviderSessions(request, response) {
    return ProviderSessionModel.find({},
        (error, providerSessions) => {
            if error ?
                 errorHandler(error) : response.json(providerSessions);
        }
    );
}*/

function updateProviderSession(socketId, providerId, clientSocketIds, done) {
    return ProviderSessionModel.findOne({ socketId: socketId },
        (error, providerSession) => {
            if (error) {
                return done(errorHandler(error), null);
            }
            providerSession.socketId = socketId;
            providerSession.providerId = providerId;
            providerSession.clientSocketIds = clientSocketIds;
            providerSession.save((error, providerSession) => {
                return error ?
                    done(errorHandler(error), null) : done(null, providerSession);
            });
        }
    );
}

function removeClientFromProvider(providerId, clientSocketId, done) {
    return ProviderSessionModel.findOneAndUpdate(
        { providerId: providerId },
        { $pull: { clientSocketIds: clientSocketId } },
        (error, provider) => {
            return error ?
                done(error, null) : done(null, provider);
        }
    );
}

function addClientToProvider(providerId, clientSocketId, done) {
    return ProviderSessionModel.findOneAndUpdate(
        { providerId: providerId },
        { $push: { clientSocketIds: clientSocketId } },
        (error, provider) => {
            return error ?
                done(error, null) : done(null, provider);
        }
    );
}

function deleteProviderSession(socketId, done) {
    return ProviderSessionModel.findOneAndRemove({ socketId: socketId },
        (error, providerSession) => {
            return error ?
                done(errorHandler(error), null) : done(null, providerSession);
        }
    );
}

module.exports = {
    createNewProviderSession: createNewProviderSession,
    findProviderSessionByProviderId: findProviderSessionByProviderId,
    findProviderSessionBySocketId: findProviderSessionBySocketId,
    updateProviderSession: updateProviderSession,
    removeClientFromProvider: removeClientFromProvider,
    addClientToProvider: addClientToProvider,
    deleteProviderSession: deleteProviderSession
};