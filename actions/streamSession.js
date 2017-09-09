var mongoose = require("mongoose");
var ProviderSessionModel = require("../models/providerSession");
var ClientSessionModel = require("../models/clientSession");
var providerSessionActions = require("./providerSession");
var clientSessionActions = require("./clientSession");
var errorActions = require("../modules/errorActions");

var errorHandler = errorActions.errorHandler;
var validationError = errorActions.validationError;

var createNewProviderSession = providerSessionActions.createNewProviderSession;
var deleteProviderSession = providerSessionActions.deleteProviderSession;
var removeClientFromProvider = providerSessionActions.removeClientFromProvider;
var findProviderSessionBySocketId = providerSessionActions.findProviderSessionBySocketId;
var addClientToProvider = providerSessionActions.addClientToProvider;

var createNewClientSession = clientSessionActions.createNewClientSession;
var findClientSession = clientSessionActions.findClientSession;
var findClientSessionsByProviderId = clientSessionActions.findClientSessionsByProviderId;
var deleteClientSession = clientSessionActions.deleteClientSession;

function createNewStreamSession(socketId, type, providerId, done) {
    if (type == "provider") {
        createNewProviderSession(socketId, providerId, new Array(), function (error, sessionInfo) {
            if (error) {
                return done(error, null);
            } else {
                findClientSessionsByProviderId(providerId, function (error, clientSessions) {
                    if (error) {
                        return done(error, null);
                    } else {
                        clientSessions.forEach(function (clientSession) {
                            addClientToProvider(providerId, clientSession.socketId, function (error, provider) {
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
        createNewClientSession(socketId, [providerId], function (error, sessionInfo) {
            if (error) {
                return done(error, null);
            } else {
                return done(null, sessionInfo);
            }
        });

    } else {
        return done(`Error: Invalid argument "type": must be "provider" or "client", but was ${type}.`, null);
    }
}

function deleteStreamSession(socketId, done) {
    findClientSession(socketId, function (error, clientSession) {
        if (error) {
            return done(error, null);

        } else if (!clientSession) {
            findProviderSessionBySocketId(socketId, function (error, providerSession) {
                if (error) {
                    return done(error, null);

                } else if (!providerSession) {
                    return done("Error: Item not found in database!", null);

                } else {
                    deleteProviderSession(socketId, function (error, providerSession) {
                        if (error) {
                            return done(error, null);
                        }
                        return done(null, {
                            type: "provider",
                            socketId: providerSession.socketId,
                            providerId: providerSession.providerId,
                            clientSocketIds: providerSession.clientSocketIds
                        });
                    });
                }
            });
        } else {

            deleteClientSession(socketId, function (error, clientSession) {
                if (error) {
                    return done(error, null);
                }
                clientSession.providerIds.forEach(function(providerId) {
                    removeClientFromProvider(providerId, socketId, function (error, changedProvider) {
                        if (error) {
                            return done(error, null);
                        }
                    });
                });
                return done(null, clientSession);
            });
        }
    });
}

module.exports = {
    createNewStreamSession: createNewStreamSession,
    deleteStreamSession: deleteStreamSession
};