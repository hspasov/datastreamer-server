const mongoose = require("mongoose");
const ProviderSessionModel = require("../models/providerSession");
const errorActions = require("../modules/errorActions");

const errorHandler = errorActions.errorHandler;
const validationError = errorActions.validationError;

function createNewProviderSession(socketId, providerName, clientSocketIds) {
    return new Promise((resolve, reject) => {
        ProviderSessionModel.create({
            socketId,
            providerName,
            clientSocketIds
        }).then(providerSession => {
            console.log("New provider session successfully created...");
            console.log(providerSession.providerName);
            resolve({
                socketId: providerSession.socketId,
                providerName: providerSession.providerName,
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

function findProviderSessionByProviderName(providerName) {
    return new Promise((resolve, reject) => {
        ProviderSessionModel.find({ providerName })
        .then(providerSessions => {
            if (providerSessions.length > 1) {
                reject(errorHandler("Error: Multiple providers with same name found in database!"));
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
        ProviderSessionModel.find({ socketId })
        .then(providerSessions => {
            if (providerSessions.length > 1) {
                reject(errorHandler("Error: Multiple providers with same name found in database!"));
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

function updateProviderSession(socketId, providerName, clientSocketIds) {
    return new Promise((resolve, reject) => {
        ProviderSessionModel.findOne({ socketId })
        .then(providerSession => {
            providerSession.socketId = socketId;
            providerSession.providerName = providerName;
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

function removeClientFromProvider(providerName, clientSocketId) {
    return new Promise((resolve, reject) => {
        ProviderSessionModel.findOneAndUpdate(
            { providerName },
            { $pull: { clientSocketIds: clientSocketId } }
        ).then(provider => {
            resolve(provider);
        }).catch(error => {
            reject(error);
        });
    });
}

function addClientToProvider(providerName, clientSocketId) {
    return new Promise((resolve, reject) => {
        ProviderSessionModel.findOneAndUpdate(
            { providerName },
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
        ProviderSessionModel.findOneAndRemove({ socketId })
        .then(providerSession => {
            resolve(providerSession);
        }).catch(error => {
            reject(error);
        });
    });
}

module.exports = {
    createNewProviderSession: createNewProviderSession,
    findProviderSessionByProviderName: findProviderSessionByProviderName,
    findProviderSessionBySocketId: findProviderSessionBySocketId,
    updateProviderSession: updateProviderSession,
    removeClientFromProvider: removeClientFromProvider,
    addClientToProvider: addClientToProvider,
    deleteProviderSession: deleteProviderSession
};