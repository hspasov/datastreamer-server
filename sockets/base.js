const providerSessionActions = require("../actions/providerSession");
const clientSessionActions = require("../actions/clientSession");
const streamSessionActions = require("../actions/streamSession");

const findProviderSocketIdByProviderName = providerSessionActions.findProviderSocketIdByProviderName;
const findClientSessionsByProviderName = providerSessionActions.findClientSessionsByProviderName;

const findClientSession = clientSessionActions.findClientSession;

const createNewStreamSession = streamSessionActions.createNewStreamSession;
const deleteStreamSession = streamSessionActions.deleteStreamSession;

const base = (io, redisClient) => {
    console.log("Inside base");
    console.log(io);
    io.on("connection", socket => {
        console.log("Connection");
        if (socket.handshake.query) {
            createNewStreamSession(
                redisClient,
                socket.id,
                socket.handshake.query["token"]
            ).then(sessionInfo => {
                console.log(`${socket.id} connected`);
                console.log(sessionInfo);
                console.log(Object.keys(io.sockets.sockets).length);
            }).catch(error => {
                console.log(error);
                socket.disconnect(true);
            });
        } else {
            console.log("no handshake query for", socket.id);
            socket.disconnect(true);
        }

        socket.on("disconnect", () => {
            deleteStreamSession(redisClient, socket.id)
            .then(sessionInfo => {
                console.log(`${socket.id} disconnected`);
                console.log(Object.keys(io.sockets.sockets).length);
                if (sessionInfo.type == "provider") {
                    sessionInfo.clientSocketIds.forEach(client => {
                        io.to(client).emit("connectToProviderFail");
                    });
                } else if (sessionInfo.type == "client") {
                    findProviderSocketIdByProviderName(redisClient, sessionInfo.providerName)
                    .then(socketId => {
                        if (socketId) {
                            io.to(socketId).emit("unsubscribedClient", socket.id);
                        }
                    }).catch(error => {
                        console.log(error);
                    });
                } else {
                    console.log("ERROR: Invalid session type", sessionInfo.type);
                }
            }).catch(error => {
                console.log(error);
            });
        });

        socket.on("connectToProvider", providerName => {
            findProviderSocketIdByProviderName(redisClient, providerName)
            .then(socketId => {
                if (!socketId) {
                    io.to(socket.id).emit("connectToProviderFail");
                } else {
                    io.to(socket.id).emit("connectToProviderSuccess");
                    io.to(socketId).emit("subscribedClient", socket.id);
                }
            }).catch(error => {
                console.log(error);
            });
        });

        socket.on("resetClientConnection", clientId => {
            io.to(clientId).emit("resetConnection");
        });

        socket.on("resetProviderConnection", providerName => {
            findProviderSocketIdByProviderName(redisClient, providerName)
                .then(socketId => {
                    if (!socketId) {
                        io.to(socket.id).emit("connectToProviderFail");
                    } else {
                        io.to(socketId).emit("resetConnection", socket.id);
                    }
                }).catch(error => {
                    console.log(error);
                });
        });

        socket.on("requestP2PConnection", clientId => {
            io.to(clientId).emit("requestedP2PConnection");
        });

        socket.on("offerP2PConnection", (providerName, description) => {
            findProviderSocketIdByProviderName(redisClient, providerName)
                .then(socketId => {
                    if (!socketId) {
                        io.to(socket.id).emit("connectToProviderFail");
                    } else {
                        io.to(socketId).emit("initConnection", socket.id, description);
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
                findProviderSocketIdByProviderName(redisClient, receiver)
                .then(socketId => {
                    if (!socketId) {
                        console.log("todo");
                    } else {
                        io.to(socketId).emit("receiveICECandidate", socket.id, candidate);
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
            findClientSessionsByProviderName(redisClient, providerName)
            .then(clientSessions => {
                clientSessions.forEach(client => {
                    io.to(client).emit("providerFound");
                });
            }).catch(error => {
                console.log(error);
            });
        });
    });
};

module.exports = base;