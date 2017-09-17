const fs = require("fs");

const providerSessionActions = require("../actions/providerSession");
const clientSessionActions = require("../actions/clientSession");
const streamSessionActions = require("../actions/streamSession");

const findProviderSessionByProviderId = providerSessionActions.findProviderSessionByProviderId;
const findProviderSessionBySocketId = providerSessionActions.findProviderSessionBySocketId;
const addClientToProvider = providerSessionActions.addClientToProvider;

const findClientSession = clientSessionActions.findClientSession;
const findClientSessionsByProviderId = clientSessionActions.findClientSessionsByProviderId;

const createNewStreamSession = streamSessionActions.createNewStreamSession;
const deleteStreamSession = streamSessionActions.deleteStreamSession;

var clients = [];

const base = io => {
    io.on("connection", socket => {
        if (socket.handshake.query)
        createNewStreamSession(
            socket.id,
            socket.handshake.query["type"],
            socket.handshake.query["id"]
        ).then(sessionInfo => {
            console.log(`${socket.id} connected`);
            console.log(sessionInfo);
            console.log(Object.keys(io.sockets.sockets).length);
        }).catch(error => {
            console.log(error);
        });

        socket.on("disconnect", () => {
            deleteStreamSession(socket.id)
            .then(sessionInfo => {
                console.log(`${socket.id} disconnected`);
                console.log(Object.keys(io.sockets.sockets).length);
                if (sessionInfo.type == "provider") {
                    sessionInfo.clientSocketIds.forEach(client => {
                        io.to(client).emit("connectToProviderFail");
                    });
                } else if (sessionInfo.type == "client") {
                    sessionInfo.providerIds.forEach(providerId => {
                        findProviderSessionByProviderId(providerId)
                        .then(providerSession => {
                            io.to(providerSession.socketId).emit("unsubscribedClient", socket.id);
                        }).catch(error => {
                            console.log(error);
                        });
                    });
                } else {
                    console.log("ERROR: Invalid session type", sessionInfo.type);
                }
            }).catch(error => {
                console.log(error);
            });
        });

        socket.on("connectToProvider", (providerId, description) => {
            findProviderSessionByProviderId(providerId)
            .then(providerSession => {
                if (!providerSession) {
                    io.to(socket.id).emit("connectToProviderFail");
                } else {
                    addClientToProvider(providerId, socket.id)
                    .then(providerSession => {
                        if (!providerSession) {
                            io.to(socket.id).emit("connectToProviderFail");
                        } else {
                            io.to(socket.id).emit("connectToProviderSuccess");
                            io.to(providerSession.socketId).emit("setRemoteDescription", socket.id, description);
                        }
                    }).catch(error => {
                        console.log(error);
                    });
                }
            }).catch(error => {
                console.log(error);
            });
        });

        socket.on("connectToClient", (clientId, description) => {
            io.to(clientId).emit("receiveProviderDescription", description);
        });

        socket.on("sendICECandidate", (receiverType, providerId, candidate) => {
            if (receiverType === "provider") {
                findProviderSessionByProviderId(providerId)
                .then(providerSession => {
                    if (!providerSession) {
                        console.log("todo");
                    } else {
                        io.to(providerSession.socketId).emit("receiveICECandidate", socket.id, candidate);
                    }
                }).catch(error => {
                    console.log(error);
                });
            } else if (receiverType === "client") {
                findClientSessionsByProviderId(providerId)
                .then(clientSessions => {
                    clientSessions.forEach(client => { // todo: emit only to one client
                        io.to(client.socketId).emit("receiveICECandidate", candidate);
                    });
                }).catch(error => {
                    console.log(error);
                });
            } else {
                console.log("Invalid receiver type", receiverType);
            }
        });

        socket.on("connectToClients", providerId => {
            findClientSessionsByProviderId(providerId)
            .then(clientSessions => {
                clientSessions.forEach(client => {
                    io.to(client.socketId).emit("providerFound");
                });
            }).catch(error => {
                console.log(error);
            });
        });

        // socket.on("sendDirectoryData", (receiver, metadata) => {
        //     io.to(receiver).emit("receiveDirectoryData", metadata);
        // });

        // socket.on("sendData", (receiver, metadata) => {
        //     if (!receiver) {
        //         io.to(socket.id).emit("receiveData", metadata);
        //     } else {
        //         io.to(receiver).emit("receiveData", metadata);
        //     }
        // });

        // socket.on("openDirectory", (providerId, selectedDirectory) => {
        //     findProviderSessionByProviderId(providerId, (error, providerSession) => {
        //         if (error) {
        //             console.log(error);
        //         } else if (!providerSession) {
        //             console.log("todo");
        //         } else {
        //             io.to(providerSession.socketId).emit("openDirectory", socket.id, selectedDirectory);
        //         }
        //     });
        // });
    });
};

module.exports = base;