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
                        console.log(`Emitting "connectToProviderFail" to client ${client} as a result of provider ${socket.id} disconnection`);
                        io.to(client).emit("connectToProviderFail");
                    });
                } else if (sessionInfo.type == "client") {
                    sessionInfo.providerNames.forEach(providerName => {
                        findProviderSessionByProviderName(providerName)
                        .then(providerSession => {
                            if (providerSession) {
                                console.log(`Emitting "unsubscribedClient" to provider ${providerName} as a result of client ${socket.id} disconnection`);
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
            console.log(`${socket.id} emitted "connectToProvider" with argument providerName=${providerName}`);
            findProviderSessionByProviderName(providerName)
            .then(providerSession => {
                if (!providerSession) {
                    console.log(`Emitting "connectToProviderFail" to client ${socket.id} as a result of no providerSession found`);
                    io.to(socket.id).emit("connectToProviderFail");
                } else {
                    addClientToProvider(providerName, socket.id)
                    .then(providerSession => {
                        if (!providerSession) {
                            console.log(`Emitting "connectToProviderFail" to client ${socket.id} as a result of no providerSession found`);
                            io.to(socket.id).emit("connectToProviderFail");
                        } else {
                            console.log(`Emitting "connectToProviderSuccess" to client ${socket.id} as a result of providerSession found ${providerSession.socketId}`);
                            io.to(socket.id).emit("connectToProviderSuccess");
                            console.log(`Emitting "subscribedClient" to provider ${providerSession.socketId} with argument ${socket.id}`);
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
            console.log(`${socket.id} emitted "resetClientConnection" with argument clientId=${clientId}`);
            console.log(`Emitting "resetConnection" to client ${clientId}`);
            io.to(clientId).emit("resetConnection");
        });

        socket.on("resetProviderConnection", providerName => {
            console.log(`${socket.id} emitted "resetProviderConnection" with argument providerName=${providerName}`);
            findProviderSessionByProviderName(providerName)
                .then(providerSession => {
                    if (!providerSession) {
                        console.log(`Emitting "connectToProviderFail" to client ${socket.id} as a result of no providerSession found`);
                        io.to(socket.id).emit("connectToProviderFail");
                    } else {
                        console.log(`Emitting "resetConnection" to provider ${providerSession.socketId} with argument client ${socket.id}`);
                        io.to(providerSession.socketId).emit("resetConnection", socket.id);
                    }
                }).catch(error => {
                    console.log(error);
                });
        });

        socket.on("requestP2PConnection", clientId => {
            console.log(`${socket.id} emitted "requestP2PConnection with argument clientId=${clientId}`);
            console.log(`Emitting "requestedP2PConnection" to client ${clientId}`);
            io.to(clientId).emit("requestedP2PConnection");
        });

        socket.on("offerP2PConnection", (providerName, description) => {
            console.log(`${socket.id} emitted "offerP2PConnection" with arguments providerName=${providerName}, description=${description}`);
            findProviderSessionByProviderName(providerName)
                .then(providerSession => {
                    if (!providerSession) {
                        console.log(`Emitting "connectToProviderFail" to client ${socket.id} as a result of no providerSession found`);
                        io.to(socket.id).emit("connectToProviderFail");
                    } else {
                        addClientToProvider(providerName, socket.id)
                            .then(providerSession => {
                                if (!providerSession) {
                                    console.log(`Emitting "connectToProviderFail" to client ${socket.id} as a result of no providerSession found`);
                                    io.to(socket.id).emit("connectToProviderFail");
                                } else {
                                    console.log(`Emitting "initConnection" to provider ${providerSession.socketId} with arguments client ${socket.id}, description ${description}`);
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
            console.log(`${socket.id} emitted "connectToClient" with arguments clientId=${clientId}, description=${description}`);
            console.log(`Emitting "receiveProviderDescription" to client ${clientId} with argument description ${description}`);
            io.to(clientId).emit("receiveProviderDescription", description);
        });

        socket.on("sendICECandidate", (receiverType, receiver, candidate) => {
            console.log(`${socket.id} emitted "sendIceCandidate" with arguments receiverType=${receiverType}, receiver=${receiver}, candidate=${candidate}`);
            if (receiverType === "provider") {
                findProviderSessionByProviderName(receiver)
                .then(providerSession => {
                    if (!providerSession) {
                        console.log("todo");
                    } else {
                        console.log(`Emitting "receiveICECandidate" to provider ${providerSession.socketId} with arguments client ${socket.id}, candidate ${candidate}`);
                        io.to(providerSession.socketId).emit("receiveICECandidate", socket.id, candidate);
                    }
                }).catch(error => {
                    console.log(error);
                });
            } else if (receiverType === "client") {
                console.log(`Emitting "receiveICECandidate" to client ${receiver} with arguments candidate ${candidate}`);
                io.to(receiver).emit("receiveICECandidate", candidate);
            } else {
                console.log("Invalid receiver type", receiverType);
            }
        });

        socket.on("connectToClients", providerName => {
            console.log(`${socket.id} emitted "connectToClients" with argument providerName=${providerName}`);
            findClientSessionsByProviderName(providerName)
            .then(clientSessions => {
                clientSessions.forEach(client => {
                    console.log(`Emitting "providerFound" to client ${client.socketId}`);
                    io.to(client.socketId).emit("providerFound");
                });
            }).catch(error => {
                console.log(error);
            });
        });
    });
};

module.exports = base;