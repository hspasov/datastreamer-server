var providerSessionActions = require("../actions/providerSession");
var clientSessionActions = require("../actions/clientSession");
var streamSessionActions = require("../actions/streamSession");

var findProviderSessionByProviderId = providerSessionActions.findProviderSessionByProviderId;
var findProviderSessionBySocketId = providerSessionActions.findProviderSessionBySocketId;
var addClientToProvider = providerSessionActions.addClientToProvider;

var findClientSession = clientSessionActions.findClientSession;
var findClientSessionsByProviderId = clientSessionActions.findClientSessionsByProviderId;

var createNewStreamSession = streamSessionActions.createNewStreamSession;
var deleteStreamSession = streamSessionActions.deleteStreamSession;

module.exports = function (io) {
    io.on("connection", function (socket) {
        createNewStreamSession(
            socket.id,
            socket.handshake.query["type"],
            socket.handshake.query["id"],
            function (error, sessionInfo) {
                if (error) {
                    console.log(error);
                } else {
                    console.log(`${socket.id} connected`);
                    console.log(sessionInfo);
                    console.log(Object.keys(io.sockets.sockets).length);
                }
            }
        );

        socket.on("disconnect", function () {
            deleteStreamSession(socket.id, function (error, sessionInfo) {
                if (error) {
                    console.log(error);
                } else {
                    console.log(`${socket.id} disconnected`);
                    console.log(Object.keys(io.sockets.sockets).length);
                    if (sessionInfo.type == "provider") {
                        sessionInfo.clientSocketIds.forEach(function (client) {
                            io.to(client).emit("connectToProviderFail");
                        });
                    }
                }
            });
        });

        socket.on("connectToProvider", function (providerId) {
            findProviderSessionByProviderId(providerId, function (error, providerSession) {
                if (error) {
                    console.log(error);
                } else if (!providerSession) {
                    io.to(socket.id).emit("connectToProviderFail");
                } else {
                    addClientToProvider(providerId, socket.id, function (error, providerSession) {
                        if (error) {
                            console.log(error);
                        } else if (!providerSession) {
                            io.to(socket.id).emit("connectToProviderFail");
                        } else {
                            console.log("Joining", providerSession.socketId);
                            socket.join(providerSession.socketId);
                            io.to(socket.id).emit("connectToProviderSuccess");
                        }
                    });
                }
            });
        });

        socket.on("connectToClients", function (providerId) {
            findClientSessionsByProviderId(providerId, function (error, clientSessions) {
                if (error) {
                    console.log(error);
                }
                clientSessions.forEach(function (client) {
                    io.to(client.socketId).emit("providerFound");
                });
            })
        });

        socket.on("getAllData", function (providerId) {
            findProviderSessionByProviderId(providerId, function (error, providerSession) {
                if (error) {
                    console.log(error);
                } else if (!providerSession) {
                    console.log("todo");
                } else {
                    io.to(providerSession.socketId).emit("getAllData", socket.id);
                }
            });
        });

        socket.on("sendData", function (receiver, metadata) {
            if (!receiver) {
                console.log(socket.id);
                io.to(socket.id).emit("receiveData", metadata);
            } else {
                io.to(receiver).emit("receiveData", metadata);
            }
        });

        socket.on("openDirectory", function (providerId, selectedDirectory) {
            findProviderSessionByProviderId(providerId, function (error, providerSession) {
                if (error) {
                    console.log(error);
                } else if (!providerSession) {
                    console.log("todo");
                } else {
                    io.to(providerSession.socketId).emit("openDirectory", socket.id, selectedDirectory);
                }
            });
        });
    });
};