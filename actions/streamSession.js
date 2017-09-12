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
const findClientSessionsByProviderId = clientSessionActions.findClientSessionsByProviderId;
const deleteClientSession = clientSessionActions.deleteClientSession;

function createNewStreamSession(socketId, type, providerId, done) {
    if (type == "provider") {
        createNewProviderSession(socketId, providerId, new Array(), (error, sessionInfo) => {
            if (error) {
                return done(error, null);
            } else {
                findClientSessionsByProviderId(providerId, (error, clientSessions) => {
                    if (error) {
                        return done(error, null);
                    } else {
                        clientSessions.forEach(clientSession => {
                            addClientToProvider(providerId, clientSession.socketId, (error, provider) => {
                                if (error) {
                                    return done(error, null);
                                }
                            })
                        });
                    }
                });
                return done(null, sessionInfo);
            }
        });

    } else if (type == "client") {
        createNewClientSession(socketId, [providerId], (error, sessionInfo) => {
            return error ?
                done(error, null) : done(null, sessionInfo);
        });

    } else {
        return done(`Error: Invalid argument "type": must be "provider" or "client", but was ${type}.`, null);
    }
}

function deleteStreamSession(socketId, done) {
    findClientSession(socketId, (error, clientSession) => {
        if (error) {
            return done(error, null);

        } else if (!clientSession) {
            findProviderSessionBySocketId(socketId, (error, providerSession) => {
                if (error) {
                    return done(error, null);

                } else if (!providerSession) {
                    return done("Error: Item not found in database!", null);

                } else {
                    deleteProviderSession(socketId, (error, providerSession) => {
                        return error ?
                            done(error, null) :
                            done(null, {
                                type: "provider",
                                socketId: providerSession.socketId,
                                providerId: providerSession.providerId,
                                clientSocketIds: providerSession.clientSocketIds
                            });
                    });
                }
            });
        } else {
            deleteClientSession(socketId, (error, clientSession) => {
                if (error) {
                    return done(error, null);
                }
                clientSession.providerIds.forEach(providerId => {
                    removeClientFromProvider(providerId, socketId, (error, changedProvider) => {
                        if (error) {
                            return done(error, null);
                        }
                    });
                });
                return done(null, {
                    type: "client",
                    socketId: clientSession.socketId,
                    providerIds: clientSession.providerIds
                });
            });
        }
    });
}

module.exports = {
    createNewStreamSession: createNewStreamSession,
    deleteStreamSession: deleteStreamSession
};