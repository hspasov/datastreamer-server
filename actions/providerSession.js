const mongoose = require("mongoose");
const ProviderSessionModel = require("../models/providerSession");
const errorActions = require("../modules/errorActions");

const errorHandler = errorActions.errorHandler;
const validationError = errorActions.validationError;

function createNewProviderSession(socketId, providerId, clientSocketIds) {
    return new Promise((resolve, reject) => {
        ProviderSessionModel.create({
            socketId: socketId,
            providerId: providerId,
            clientSocketIds: clientSocketIds
        }).then(providerSession => {
            console.log("New provider session successfully created...");
            console.log(providerSession.providerId);
            resolve({
                socketId: providerSession.socketId,
                providerId: providerSession.providerId,
                clientSocketIds: providerSession.clientSocketIds
            });
        }).catch(error => {
            console.error("There was an error creating the provider session");
            console.error(error.code);
            console.error(error.name);
            reject((error.name == "validationerror") ?
                validationError(error) : errorHandler(error));
        });
    });
}

function findProviderSessionByProviderId(providerId) {
    return new Promise((resolve, reject) => {
        ProviderSessionModel.find({ providerId: providerId })
        .then(providerSessions => {
            if (providerSessions.length > 1) {
                reject(errorHandler("Error: Multiple providers with same id found in database!"));
            } else if (providerSessions.length == 0) {
                resolve(null);
            } else if (providerSessions.length == 1) {
                resolve(providerSessions[0]);
            } else {
                reject("Error: Invalid state", providerSessions);
            }
        }).catch(error => {
            reject(errorHandler(error));
        });
    });
}

function findProviderSessionBySocketId(socketId) {
    return new Promise((resolve, reject) => {
        ProviderSessionModel.find({ socketId: socketId })
        .then(providerSessions => {
            if (providerSessions.length > 1) {
                reject(errorHandler("Error: Multiple providers with same id found in database!"));
            } else if (providerSessions.length == 0) {
                resolve(null, null);
            } else if (providerSessions.length == 1) {
                resolve(providerSessions[0]);
            } else {
                reject("Error: Invalid state", providerSessions);
            }
        }).catch(error => {
            reject(errorHandler(error));
        });
    });
}

/*function viewAllProviderSessions(request, response) {
    return ProviderSessionModel.find({},
        (error, providerSessions) => {
            if error ?
                 errorHandler(error) : response.json(providerSessions);
        }
    );
}*/

function updateProviderSession(socketId, providerId, clientSocketIds) {
    return new Promise((resolve, reject) => {
        ProviderSessionModel.findOne({ socketId: socketId })
        .then(providerSession => {
            providerSession.socketId = socketId;
            providerSession.providerId = providerId;
            providerSession.clientSocketIds = clientSocketIds;
            providerSession.save()
            .then(providerSession => {
                resolve(providerSession);
            }).catch(error => {
                reject(errorHandler(error));
            });
        }).catch(error => {
            reject(errorHandler(error));
        });
    });
}

function removeClientFromProvider(providerId, clientSocketId) {
    return new Promise((resolve, reject) => {
        ProviderSessionModel.findOneAndUpdate(
            { providerId: providerId },
            { $pull: { clientSocketIds: clientSocketId } }
        ).then(provider => {
            resolve(provider);
        }).catch(error => {
            reject(error);
        });
    });
}

function addClientToProvider(providerId, clientSocketId) {
    return new Promise((resolve, reject) => {
        ProviderSessionModel.findOneAndUpdate(
            { providerId: providerId },
            { $push: { clientSocketIds: clientSocketId } }
        ).then(provider => {
            resolve(provider);
        }).catch(error => {
            reject(error);
        });
    });
}

function deleteProviderSession(socketId) {
    return new Promise((resolve, reject) => {
        ProviderSessionModel.findOneAndRemove({ socketId: socketId })
        .then(providerSession => {
            resolve(providerSession);
        }).catch(error => {
            reject(error);
        });
    });
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