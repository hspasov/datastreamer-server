const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

const providerSessionActions = require("./providerSession");
const clientSessionActions = require("./clientSession");
const errorActions = require("../modules/errorActions");

const errorHandler = errorActions.errorHandler;
const validationError = errorActions.validationError;

const createNewProviderSession = providerSessionActions.createNewProviderSession;
const deleteProviderSession = providerSessionActions.deleteProviderSession;
const findProviderNameBySocketId = providerSessionActions.findProviderNameBySocketId;

const createNewClientSession = clientSessionActions.createNewClientSession;
const findClientSession = clientSessionActions.findClientSession;
const deleteClientSession = clientSessionActions.deleteClientSession;

function createNewStreamSession(socketId, token) {
    return new Promise((resolve, reject) => {
        fs.readFileAsync(path.join(__dirname, "../config/pubkey.pem")).then(certificate => {
            return jwt.verifyAsync(token, certificate, {
                issuer: "datastreamer-server",
                algorithm: ["RS256"]
            });
        }).then(decoded => {
            if (decoded.sub === "provider") {
                return createNewProviderSession(socketId, decoded.username);
            } else if (decoded.sub == "clientConnection") {
                return createNewClientSession(socketId, decoded.provider);
            } else {
                reject(`Error: Invalid argument "subject": must be "provider" or "clientConnection", but was ${decoded.subject}.`);
            }
        }).then(sessionInfo => {
            resolve(sessionInfo);
        }).catch(error => {
            reject(error);
        });
    });
}

function deleteStreamSession(socketId) {
    return new Promise((resolve, reject) => {
        findClientSession(socketId).then(clientSession => {
            if (!clientSession) {
                findProviderNameBySocketId(socketId).then(providerName => {
                    if (!providerName) {
                        reject("Error: Item not found in database!");
                    } else {
                        deleteProviderSession(socketId).then(providerSession => {
                            resolve({
                                type: "provider",
                                socketId: providerSession.socketId,
                                providerName: providerSession.providerName,
                                clientSocketIds: providerSession.clientSocketIds
                            });
                        });
                    }
                });
            } else {
                deleteClientSession(socketId).then(clientSession => {
                    resolve({
                        type: "client",
                        socketId: clientSession.socketId,
                        providerName: clientSession.providerName
                    });
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