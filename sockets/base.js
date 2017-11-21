const debug = require("debug");
const log = {
    info: debug("datastreamer-server:info"),
    error: debug("datastreamer-server:info:ERROR"),
    verbose: debug("datastreamer-server:verbose")
};

const providerSessionActions = require("../actions/providerSession");
const clientSessionActions = require("../actions/clientSession");
const streamSessionActions = require("../actions/streamSession");

const findProviderSocketIdByProviderName = providerSessionActions.findProviderSocketIdByProviderName;
const findProviderSocketIdByClientSocketId = providerSessionActions.findProviderSocketIdByClientSocketId;
const findClientSessionsByProviderSocketId = providerSessionActions.findClientSessionsByProviderSocketId;

const findClientSession = clientSessionActions.findClientSession;

const createNewStreamSession = streamSessionActions.createNewStreamSession;
const deleteStreamSession = streamSessionActions.deleteStreamSession;

const base = io => {
    log.verbose("Initialising sockets");
    io.on("connection", socket => {
        log.verbose("A new socket connection.");
        if (socket.handshake.query) {
            createNewStreamSession(
                socket.id,
                socket.handshake.query["token"]
            ).then(sessionInfo => {
                log.info(`${socket.id} connected`);
                log.verbose(sessionInfo);
                log.verbose(Object.keys(io.sockets.sockets).length);
                if (sessionInfo.type === "clientConnection") {
                    if (sessionInfo.provider.isConnected) {
                        io.to(socket.id).emit("connectToProviderSuccess");
                        io.to(sessionInfo.provider.socketId).emit("subscribedClient", socket.id);
                    } else {
                        log.verbose(`Client "${socket.id}" could not connect to provider "${sessionInfo.providerName}". Provider not connected.`);
                        io.to(socket.id).emit("connectToProviderFail", "ProviderNotConnectedError");
                    }
                }
            }).catch(error => {
                log.error(error);
                log.error(error.name);
                io.to(socket.id).emit("connectToProviderFail", error.name);
                socket.disconnect(true);
            });
        } else {
            log.error("no handshake query for", socket.id);
            socket.disconnect(true);
        }

        socket.on("disconnect", () => {
            deleteStreamSession(socket.id).then(sessionInfo => {
                log.info(`${socket.id} disconnected`);
                log.info(`${Object.keys(io.sockets.sockets).length} sockets left.`);
                if (sessionInfo.type == "provider") {
                    sessionInfo.clientSocketIds.forEach(client => {
                        io.to(client).emit("connectToProviderFail", "ProviderNotConnectedError");
                    });
                } else if (sessionInfo.type == "client") {
                    findProviderSocketIdByProviderName(sessionInfo.providerName).then(socketId => {
                        if (socketId) {
                            io.to(socketId).emit("unsubscribedClient", socket.id);
                        }
                    }).catch(error => {
                        log.error(error);
                    });
                } else {
                    log.error("ERROR: Invalid session type", sessionInfo.type);
                }
            }).catch(error => {
                log.error(error);
            });
        });

        socket.on("resetClientConnection", clientId => {
            io.to(clientId).emit("resetConnection");
        });

        socket.on("resetProviderConnection", () => {
            findProviderSocketIdByClientSocketId(socket.id).then(socketId => {
                if (!socketId) {
                    io.to(socket.id).emit("connectToProviderFail", "ProviderNotConnectedError");
                } else {
                    io.to(socketId).emit("resetConnection", socket.id);
                }
            }).catch(error => {
                log.error(error);
            });
        });

        socket.on("requestP2PConnection", clientId => {
            io.to(clientId).emit("requestedP2PConnection");
        });

        socket.on("offerP2PConnection", description => {
            findProviderSocketIdByClientSocketId(socket.id).then(socketId => {
                if (!socketId) {
                    io.to(socket.id).emit("connectToProviderFail", "ProviderNotConnectedError");
                } else {
                    io.to(socketId).emit("initConnection", socket.id, description);
                }
            }).catch(error => {
                log.error(error);
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
                        log.info("todo");
                    } else {
                        io.to(socketId).emit("receiveICECandidate", socket.id, candidate);
                    }
                }).catch(error => {
                    log.error(error);
                });
            }
        });

        socket.on("connectToClients", () => {
            findClientSessionsByProviderSocketId(socket.id).then(clientSessions => {
                clientSessions.forEach(client => {
                    io.to(socket.id).emit("subscribedClient", client);
                    io.to(client).emit("connectToProviderSuccess");
                });
            }).catch(error => {
                log.error(error);
            });
        });
    });
};

module.exports = base;