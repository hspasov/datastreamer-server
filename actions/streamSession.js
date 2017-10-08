const providerSessionActions = require("./providerSession");
const clientSessionActions = require("./clientSession");
const errorActions = require("../modules/errorActions");

const errorHandler = errorActions.errorHandler;
const validationError = errorActions.validationError;

const createNewProviderSession = providerSessionActions.createNewProviderSession;
const deleteProviderSession = providerSessionActions.deleteProviderSession;
const findProviderNameBySocketId = providerSessionActions.findProviderNameBySocketId;
const findClientSessionsByProviderName = providerSessionActions.findClientSessionsByProviderName;

const createNewClientSession = clientSessionActions.createNewClientSession;
const findClientSession = clientSessionActions.findClientSession;
const deleteClientSession = clientSessionActions.deleteClientSession;

function createNewStreamSession(redisClient, socketId, type, providerName) {
    return new Promise((resolve, reject) => {
        if (type == "provider") {
            createNewProviderSession(redisClient, socketId, providerName)
            .then(sessionInfo => {
                resolve(sessionInfo);
            }).catch(error => {
                reject(error);
            });
        } else if (type == "client") {
            createNewClientSession(redisClient, socketId, providerName)
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

function deleteStreamSession(redisClient, socketId, done) {
    return new Promise((resolve, reject) => {
        findClientSession(redisClient, socketId)
        .then(clientSession => {
            if (!clientSession) {
                findProviderNameBySocketId(redisClient, socketId)
                .then(providerName => {
                    if (!providerName) {
                        reject("Error: Item not found in database!");
                    } else {
                        deleteProviderSession(redisClient, socketId)
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
                deleteClientSession(redisClient, socketId)
                .then(clientSession => {
                    resolve({
                        type: "client",
                        socketId: clientSession.socketId,
                        providerName: clientSession.providerName
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