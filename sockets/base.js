const providerSessionActions = require("../actions/providerSession");
const clientSessionActions = require("../actions/clientSession");
const streamSessionActions = require("../actions/streamSession");

const findProviderSessionByProviderName = providerSessionActions.findProviderSessionByProviderName;
const findProviderSessionBySocketId = providerSessionActions.findProviderSessionBySocketId;
const addClientToProvider = providerSessionActions.addClientToProvider;

const findClientSession = clientSessionActions.findClientSession;
const findClientSessionsByProviderName = clientSessionActions.findClientSessionsByProviderName;

const createNewStreamSession = streamSessionActions.createNewStreamSession;
const deleteStreamSession = streamSessionActions.deleteStreamSession;

const base = io => {
    io.on("connection", socket => {
        if (socket.handshake.query) {
            createNewStreamSession(
                socket.id,
                socket.handshake.query["type"],
                socket.handshake.query["username"]
            ).then(sessionInfo => {
                console.log(`${socket.id} connected`);
                console.log(sessionInfo);
                console.log(Object.keys(io.sockets.sockets).length);
            }).catch(error => {
                console.log(error);
            });
        } else {
            console.log("no handshake query for", socket.id);
        }

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
                    sessionInfo.providerNames.forEach(providerName => {
                        findProviderSessionByProviderName(providerName)
                        .then(providerSession => {
                            if (providerSession) {
                                io.to(providerSession.socketId).emit("unsubscribedClient", socket.id);
                            }
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

        socket.on("connectToProvider", providerName => {
            findProviderSessionByProviderName(providerName)
            .then(providerSession => {
                if (!providerSession) {
                    io.to(socket.id).emit("connectToProviderFail");
                } else {
                    addClientToProvider(providerName, socket.id)
                    .then(providerSession => {
                        if (!providerSession) {
                            io.to(socket.id).emit("connectToProviderFail");
                        } else {
                            io.to(socket.id).emit("connectToProviderSuccess");
                            io.to(providerSession.socketId).emit("subscribedClient", socket.id);
                        }
                    }).catch(error => {
                        console.log(error);
                    });
                }
            }).catch(error => {
                console.log(error);
            });
        });

        socket.on("resetClientConnection", clientId => {
            io.to(clientId).emit("resetConnection");
        });

        socket.on("resetProviderConnection", providerName => {
            findProviderSessionByProviderName(providerName)
                .then(providerSession => {
                    if (!providerSession) {
                        io.to(socket.id).emit("connectToProviderFail");
                    } else {
                        io.to(providerSession.socketId).emit("resetConnection", socket.id);
                    }
                }).catch(error => {
                    console.log(error);
                });
        });

        socket.on("requestP2PConnection", clientId => {
            io.to(clientId).emit("requestedP2PConnection");
        });

        socket.on("offerP2PConnection", (providerName, description) => {
            findProviderSessionByProviderName(providerName)
                .then(providerSession => {
                    if (!providerSession) {
                        io.to(socket.id).emit("connectToProviderFail");
                    } else {
                        addClientToProvider(providerName, socket.id)
                            .then(providerSession => {
                                if (!providerSession) {
                                    io.to(socket.id).emit("connectToProviderFail");
                                } else {
                                    io.to(providerSession.socketId).emit("initConnection", socket.id, description);
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

        socket.on("sendICECandidate", (receiverType, receiver, candidate) => {
            if (receiverType === "provider") {
                findProviderSessionByProviderName(receiver)
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
                io.to(receiver).emit("receiveICECandidate", candidate);
            } else {
                console.log("Invalid receiver type", receiverType);
            }
        });

        socket.on("connectToClients", providerName => {
            findClientSessionsByProviderName(providerName)
            .then(clientSessions => {
                clientSessions.forEach(client => {
                    io.to(client.socketId).emit("providerFound");
                });
            }).catch(error => {
                console.log(error);
            });
        });
    });
};

module.exports = base;