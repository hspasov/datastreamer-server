const mongoose = require("mongoose");
const ProviderSessionModel = require("../models/providerSession");
const ClientSessionModel = require("../models/clientSession");
const providerSessionActions = require("./providerSession");
const clientSessionActions = require("./clientSession");
const errorActions = require("../modules/errorActions");

const errorHandler = errorActions.errorHandler;
const validationError = errorActions.validationError;

const createNewProviderSession = providerSessionActions.createNewProviderSession;
const deleteProviderSession = providerSessionActions.deleteProviderSession;
const removeClientFromProvider = providerSessionActions.removeClientFromProvider;
const findProviderSessionBySocketId = providerSessionActions.findProviderSessionBySocketId;
const addClientToProvider = providerSessionActions.addClientToProvider;

const createNewClientSession = clientSessionActions.createNewClientSession;
const findClientSession = clientSessionActions.findClientSession;
const findClientSessionsByProviderName = clientSessionActions.findClientSessionsByProviderName;
const deleteClientSession = clientSessionActions.deleteClientSession;

function createNewStreamSession(socketId, type, providerName) {
    return new Promise((resolve, reject) => {
        if (type == "provider") {
            createNewProviderSession(socketId, providerName, new Array())
            .then(sessionInfo => {
                findClientSessionsByProviderName(providerName)
                .then(clientSessions => {
                    clientSessions.forEach(clientSession => {
                        addClientToProvider(providerName, clientSession.socketId)
                        .catch(error => {
                            reject(error);
                        });
                    });
                }).catch(error => {
                    reject(error);
                });
                resolve(sessionInfo);
            }).catch(error => {
                reject(error);
            });
        } else if (type == "client") {
            createNewClientSession(socketId, [providerName])
            .then(sessionInfo => {
                resolve(sessionInfo);
            }).catch(error => {
                reject(error);
            });
        } else {
            reject(`Error: Invalid argument "type": must be "provider" or "client", but was ${type}.`);
        }
    });
}

function deleteStreamSession(socketId, done) {
    return new Promise((resolve, reject) => {
        findClientSession(socketId)
        .then(clientSession => {
            if (!clientSession) {
                findProviderSessionBySocketId(socketId)
                .then(providerSession => {
                    if (!providerSession) {
                        reject("Error: Item not found in database!");
                    } else {
                        deleteProviderSession(socketId)
                        .then(providerSession => {
                            resolve({
                                type: "provider",
                                socketId: providerSession.socketId,
                                providerName: providerSession.providerName,
                                clientSocketIds: providerSession.clientSocketIds
                            });
                        }).catch(error => {
                            reject(error);
                        });
                    }
                }).catch(error => {
                    reject(error);
                });
            } else {
                deleteClientSession(socketId)
                .then(clientSession => {
                    clientSession.providerNames.forEach(providerName => {
                        removeClientFromProvider(providerName, socketId)
                        .catch(error => {
                            reject(error);
                        });
                    });
                    resolve({
                        type: "client",
                        socketId: clientSession.socketId,
                        providerNames: clientSession.providerNames
                    });
                }).catch(error => {
                    reject(error);
                });
            }
        }).catch(error => {
            reject(error);
        });
    });
}

module.exports = {
    createNewStreamSession: createNewStreamSession,
    deleteStreamSession: deleteStreamSession
};