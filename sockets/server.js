const log = require("../modules/log");
const { verifyToken } = require("../modules/token-actions");
const { findClientSession } = require("../db/redis/client-session");
const {
    findProviderSocketIdByProviderName,
    findProviderSocketIdByClientSocketId,
    findClientSessionsByProviderSocketId
} = require("../db/redis/provider-session");
const {
    createPeerSession,
    deletePeerSession
} = require("../db/redis/peer-session");

const socketServer = io => {
    log.verbose("Initialising sockets");
    io.on("connection", socket => {
        log.verbose("A new socket connection.");
        if (socket.handshake.query) {
            createPeerSession(
                socket.id,
                socket.handshake.query.token
            ).then(sessionInfo => {
                if (!sessionInfo) {
                    io.to(socket.id).emit("connectFail", "TokenExpiredError");
                } else {
                    log.info(`${socket.id} connected`);
                    log.verbose(sessionInfo);
                    log.verbose(Object.keys(io.sockets.sockets).length);
                    if (sessionInfo.type === "clientConnection") {
                        if (sessionInfo.provider.isConnected) {
                            io.to(socket.id).emit("connectToProviderSuccess");
                            io.to(sessionInfo.provider.socketId)
                                .emit(
                                "subscribedClient",
                                socket.id,
                                socket.handshake.query.token,
                                sessionInfo.client.username, {
                                    readable: sessionInfo.readable,
                                    writable: sessionInfo.writable
                                });
                        } else {
                            log.verbose(`Client "${socket.id}" could not connect to provider "${sessionInfo.provider.providerName}". Provider not connected.`);
                            io.to(socket.id).emit("connectFail", "ProviderNotConnectedError");
                        }
                    }
                }
            }).catch(error => {
                log.error(error);
                io.to(socket.id).emit("connectFail", error.name);
                socket.disconnect(true);
            });
        } else {
            socket.disconnect(true);
        }

        socket.on("disconnect", () => {
            deletePeerSession(socket.id).then(sessionInfo => {
                log.info(`${socket.id} disconnected`);
                log.info(`${Object.keys(io.sockets.sockets).length} sockets left.`);
                if (sessionInfo.type === "provider") {
                    sessionInfo.clientSocketIds.forEach(client => {
                        io.to(client).emit("connectFail", "ProviderNotConnectedError");
                    });
                } else if (sessionInfo.type === "client") {
                    findProviderSocketIdByProviderName(sessionInfo.providerName).then(socketId => {
                        if (socketId) {
                            io.to(socketId).emit("unsubscribedClient", socket.id);
                        }
                    }).catch(error => {
                        log.error(error);
                        socket.disconnect(true);
                    });
                } else {
                    log.error("ERROR: Invalid session type", sessionInfo.type);
                    socket.disconnect(true);
                }
            }).catch(error => {
                log.error(error);
                socket.disconnect(true);
            });
        });

        socket.on("resetClientConnection", clientId => {
            io.to(clientId).emit("resetConnection");
        });

        socket.on("resetProviderConnection", () => {
            findProviderSocketIdByClientSocketId(socket.id).then(socketId => {
                if (!socketId) {
                    io.to(socket.id).emit("connectFail", "ProviderNotConnectedError");
                } else {
                    io.to(socketId).emit("resetConnection", socket.id);
                }
            }).catch(error => {
                log.error(error);
                socket.disconnect(true);
            });
        });

        socket.on("requestP2PConnection", clientId => {
            io.to(clientId).emit("requestedP2PConnection");
        });

        socket.on("offerP2PConnection", description => {
            findProviderSocketIdByClientSocketId(socket.id).then(socketId => {
                if (!socketId) {
                    io.to(socket.id).emit("connectFail", "ProviderNotConnectedError");
                } else {
                    io.to(socketId).emit("initConnection", socket.id, description);
                }
            }).catch(error => {
                log.error(error);
                socket.disconnect(true);
            });
        });

        socket.on("connectToClient", (clientId, description) => {
            io.to(clientId).emit("receiveProviderDescription", description);
        });

        socket.on("sendICECandidate", (candidate, receiver) => {
            if (receiver) {
                io.to(receiver).emit("receiveICECandidate", candidate);
            } else {
                findProviderSocketIdByClientSocketId(socket.id).then(socketId => {
                    if (!socketId) {
                        io.to(socket.id).emit("connectFail", "ProviderNotConnectedError");
                    } else {
                        io.to(socketId).emit("receiveICECandidate", socket.id, candidate);
                    }
                }).catch(error => {
                    log.error(error);
                    socket.disconnect(true);
                });
            }
        });

        socket.on("connectToClients", () => {
            findClientSessionsByProviderSocketId(socket.id).then(clientSessions => {
                clientSessions.forEach(client => {
                    io.to(client).emit("requestToken");
                });
            }).catch(error => {
                log.error(error);
                socket.disconnect(true);
            });
        });

        socket.on("provideToken", token => {
            let providerSocketId;
            findProviderSocketIdByClientSocketId(socket.id).then(socketId => {
                providerSocketId = socketId;
                return verifyToken(token);
            }).then(decoded => {
                if (!decoded) {
                    io.to(socket.id).emit("connectFail", "TokenExpiredError");
                } else {
                    io.to(providerSocketId)
                        .emit("subscribedClient", socket.id, token, decoded.client, {
                            readable: decoded.readable,
                            writable: decoded.writable
                        });
                    io.to(socket.id).emit("connectToProviderSuccess");
                }
            }).catch(error => {
                log.error(error);
                socket.disconnect(true);
            });
        });
    });
};

module.exports = socketServer;