const mongoose = require("mongoose");
const ClientSessionModel = require("../models/clientSession");
const errorActions = require("../modules/errorActions");

const errorHandler = errorActions.errorHandler;
const validationError = errorActions.validationError;

function createNewClientSession(socketId, providerNames) {
    return new Promise((resolve, reject) => {
        ClientSessionModel.create({
            socketId,
            providerNames
        }).then(clientSession => {
            console.log("New client session successfully created...");
            console.log(clientSession.socketId);
            resolve({
                socketId: clientSession.socketId,
                providerNames: clientSession.providerNames
            });
        }).catch(error => {
            console.error("There was an error creating the client session");
            console.error(error.code);
            console.error(error.name);
            if (error.name == "validationerror") {
                reject(validationError(error));
            }
            else {
                reject(errorHandler(error));
            }
        })
    });
}

function findClientSessionsByProviderName(providerName) {
    return new Promise((resolve, reject) => {
        ClientSessionModel.find({ providerNames: providerName })
        .then(clientSessions => {
            resolve(clientSessions);
        }).catch(error => {
            reject(error);
        });
    });
}

function findClientSession(socketId) {
    return new Promise((resolve, reject) => {
        ClientSessionModel.find({ socketId: socketId })
        .then(clientSessions => {
            if (clientSessions.length > 1) {
                reject(errorHandler("Error: Multiple clients with same id found in database!"));
            } else if (clientSessions.length == 0) {
                resolve(null);
            } else if (clientSessions.length == 1) {
                resolve(clientSessions[0]);
            } else {
                reject({
                    msg: "Error: Invalid state",
                    clientSessions: clientSessions
                });
            }
        }).catch(error => {
            reject(errorHandler(error));
        });
    });
}

/*function viewAllClientSessions(request, response) {
    return ClientSessionModel.find({},
        (error, clientSessions) => {
            return error ?
                errorHandler(error) : response.json(clientSessions);
        }
    );
}*/

function updateClientSession(socketId, providerNames) {
    return new Promise((resolve, reject) => {
        ClientSessionModel.findOne({ socketId: socketId })
        .then(clientSession => {
            clientSession.socketId = socketId;
            clientSession.providerNames = providerNames;
            clientSession.save()
            .then(clientSession => {
                resolve(clientSession);
            }).catch(error => {
                reject(errorHandler(error));
            });
        }).catch(error => {
            reject(errorHandler(error));
        });
    });
}

function removeProviderFromClient(providerName, clientSocketId) {
    return new Promise((resolve, reject) => {
        ClientSessionModel.findOneAndUpdate(
            { socketId: clientSocketId },
            { $pull: { providerNames: providerName } }
        ).then(client => {
            resolve(client);
        }).catch(error => {
            reject(error);
        });
    });
}

function addProviderToClient(providerName, clientSocketId) {
    return new Promise((resolve, reject) => {
        ClientSessionModel.findOneAndUpdate(
            { socketId: clientSocketId },
            { $push: { providerNames: providerName } }
        ).then(client => {
            resolve(client);
        }).catch(error => {
            reject(error);
        });
    });
}

function deleteClientSession(socketId) {
    return new Promise((resolve, reject) => {
        ClientSessionModel.findOneAndRemove({ socketId: socketId })
        .then(clientSession => {
            resolve(clientSession);
        }).catch(error => {
            reject(errorHandler(error));
        });
    });
}

module.exports = {
    createNewClientSession: createNewClientSession,
    findClientSession: findClientSession,
    findClientSessionsByProviderName: findClientSessionsByProviderName,
    updateClientSession: updateClientSession,
    addProviderToClient: addProviderToClient,
    removeProviderFromClient: removeProviderFromClient,
    deleteClientSession: deleteClientSession
};