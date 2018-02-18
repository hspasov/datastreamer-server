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
                    io.to(socket.id).emit("connect_reject", "TokenExpiredError");
                } else {
                    log.info(`${socket.id} connected`);
                    log.verbose(sessionInfo);
                    log.verbose(Object.keys(io.sockets.sockets).length);
                    if (sessionInfo.type === "clientConnection") {
                        if (sessionInfo.provider.isConnected) {
                            io.to(socket.id).emit("provider_connect");
                            io.to(sessionInfo.provider.socketId)
                                .emit(
                                "client_connect",
                                socket.id,
                                socket.handshake.query.token,
                                sessionInfo.client.username, {
                                    readable: sessionInfo.readable,
                                    writable: sessionInfo.writable
                                });
                        } else {
                            log.verbose(`Client "${socket.id}" could not connect to provider "${sessionInfo.provider.providerName}". Provider not connected.`);
                            io.to(socket.id).emit("connect_reject", "ProviderNotConnectedError");
                        }
                    }
                }
            }).catch(error => {
                log.error(error);
                io.to(socket.id).emit("connect_reject", error.name);
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
                        io.to(client).emit("connect_reject", "ProviderNotConnectedError");
                    });
                } else if (sessionInfo.type === "client") {
                    findProviderSocketIdByProviderName(sessionInfo.providerName).then(socketId => {
                        if (socketId) {
                            io.to(socketId).emit("client_disconnect", socket.id);
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

        socket.on("connect_reset", clientId => {
            if (clientId) {
                io.to(clientId).emit("connect_reset");
            } else {
                findProviderSocketIdByClientSocketId(socket.id).then(socketId => {
                    if (!socketId) {
                        io.to(socket.id).emit("connect_reject", "ProviderNotConnectedError");
                    } else {
                        io.to(socketId).emit("connect_reset", socket.id);
                    }
                }).catch(error => {
                    log.error(error);
                    socket.disconnect(true);
                });
            }
        });

        socket.on("p2p_request", clientId => {
            io.to(clientId).emit("p2p_request");
        });

        socket.on("description", (description, receiver) => {
            if (receiver) {
                io.to(receiver).emit("description", description);
            } else {
                findProviderSocketIdByClientSocketId(socket.id).then(socketId => {
                    if (!socketId) {
                        io.to(socket.id).emit("connect_reject", "ProviderNotConnectedError");
                    } else {
                        io.to(socketId).emit("description", socket.id, description);
                    }
                }).catch(error => {
                    log.error(error);
                    socket.disconnect(true);
                });
            }
        });

        socket.on("ice_candidate", (candidate, receiver) => {
            if (receiver) {
                io.to(receiver).emit("ice_candidate", candidate);
            } else {
                findProviderSocketIdByClientSocketId(socket.id).then(socketId => {
                    if (!socketId) {
                        io.to(socket.id).emit("connect_reject", "ProviderNotConnectedError");
                    } else {
                        io.to(socketId).emit("ice_candidate", socket.id, candidate);
                    }
                }).catch(error => {
                    log.error(error);
                    socket.disconnect(true);
                });
            }
        });

        socket.on("client_tokens_request", () => {
            findClientSessionsByProviderSocketId(socket.id).then(clientSessions => {
                clientSessions.forEach(client => {
                    io.to(client).emit("token_request");
                });
            }).catch(error => {
                log.error(error);
                socket.disconnect(true);
            });
        });

        socket.on("token_response", token => {
            let providerSocketId;
            findProviderSocketIdByClientSocketId(socket.id).then(socketId => {
                providerSocketId = socketId;
                return verifyToken(token);
            }).then(decoded => {
                if (!decoded) {
                    io.to(socket.id).emit("connect_reject", "TokenExpiredError");
                } else {
                    io.to(providerSocketId)
                        .emit("client_connect", socket.id, token, decoded.client, {
                            readable: decoded.readable,
                            writable: decoded.writable
                        });
                    io.to(socket.id).emit("provider_connect");
                }
            }).catch(error => {
                log.error(error);
                socket.disconnect(true);
            });
        });

        socket.on("close_client_connection", clientSocketId => {
            findProviderSocketIdByClientSocketId(clientSocketId).then(providerSocketId => {
                if (providerSocketId && socket.id === providerSocketId) {
                    if (io.sockets.connected[clientSocketId]) {
                        io.sockets.connected[clientSocketId].disconnect();
                    }
                }
            }).catch(error => {
                log.error(error);
                socket.disconnect(true);
            });
        });
    });
};

module.exports = socketServer;