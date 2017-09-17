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
            socket.handshake.query["id"],
            (error, sessionInfo) => {
                if (error) {
                    console.log(error);
                } else {
                    console.log(`${socket.id} connected`);
                    console.log(sessionInfo);
                    console.log(Object.keys(io.sockets.sockets).length);
                }
            }
        );

        socket.on("disconnect", () => {
            deleteStreamSession(socket.id, (error, sessionInfo) => {
                if (error) {
                    console.log(error);
                } else {
                    console.log(`${socket.id} disconnected`);
                    console.log(Object.keys(io.sockets.sockets).length);
                    if (sessionInfo.type == "provider") {
                        sessionInfo.clientSocketIds.forEach(client => {
                            io.to(client).emit("connectToProviderFail");
                        });
                    } else if (sessionInfo.type == "client") {
                        sessionInfo.providerIds.forEach(providerId => {
                            findProviderSessionByProviderId(providerId, (error, providerSession) => {
                                if (error) {
                                    console.log(error);
                                } else if (providerSession) {
                                    io.to(providerSession.socketId).emit("unsubscribedClient", socket.id);
                                }
                            });
                        });
                    } else {
                        console.log("ERROR: Invalid session type", sessionInfo.type);
                    }
                }
            });
        });

        socket.on("createOffer", (providerId, description) => {
            findProviderSessionByProviderId(providerId, (error, providerSession) => {
                if (error) {
                    console.log(error);
                } else if (!providerSession) {
                    io.to(socket.id).emit("connectToProviderFail");
                } else {
                    addClientToProvider(providerId, socket.id, (error, providerSession) => {
                        if (error) {
                            console.log(error);
                        } else if (!providerSession) {
                            io.to(socket.id).emit("connectToProviderFail");
                        } else {
                            io.to(socket.id).emit("connectToProviderSuccess");
                            io.to(providerSession.socketId).emit("setRemoteDescription", description);

                        }
                    });
                }
            });
        });

        socket.on("connectToClient", (providerId, description) => { // works only for one client
            findClientSessionsByProviderId(providerId, (error, clientSessions) => {
                if (error) {
                    console.log(error);
                }
                clientSessions.forEach(client => {
                    io.to(client.socketId).emit("setRemoteDescription", description);
                });
            });
        });

        socket.on("iceCallback1", (providerId, candidate) => {
            findProviderSessionByProviderId(providerId, (error, providerSession) => {
                if (error) {
                    console.log(error);
                } else if (!providerSession) {
                    console.log("todo");
                } else {
                    io.to(providerSession.socketId).emit("iceCallback1", socket.id, candidate);
                }
            });
        });

        socket.on("iceCallback2", (providerId, candidate) => {
            findClientSessionsByProviderId(providerId, (error, clientSessions) => {
                if (error) {
                    console.log(error);
                }
                clientSessions.forEach(client => {
                    io.to(client.socketId).emit("iceCallback2", candidate);
                });
            });
        });

        socket.on("connectToProvider", providerId => {
            findProviderSessionByProviderId(providerId, (error, providerSession) => {
                if (error) {
                    console.log(error);
                } else if (!providerSession) {
                    io.to(socket.id).emit("connectToProviderFail");
                } else {
                    addClientToProvider(providerId, socket.id, (error, providerSession) => {
                        if (error) {
                            console.log(error);
                        } else if (!providerSession) {
                            io.to(socket.id).emit("connectToProviderFail");
                        } else {
                            io.to(socket.id).emit("connectToProviderSuccess");
                        }
                    });
                }
            });
        });

        socket.on("connectToClients", providerId => {
            findClientSessionsByProviderId(providerId, (error, clientSessions) => {
                if (error) {
                    console.log(error);
                }
                clientSessions.forEach(client => {
                    io.to(client.socketId).emit("providerFound");
                });
            })
        });

        socket.on("subscribeToProvider", providerId => {
            findProviderSessionByProviderId(providerId, (error, providerSession) => {
                if (error) {
                    console.log(error);
                } else if (!providerSession) {
                    console.log("todo");
                } else {
                    io.to(providerSession.socketId).emit("subscribedClient", socket.id);
                }
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

        // socket.on("downloadFile", (providerId, filePath) => {
        //     findProviderSessionByProviderId(providerId, (error, providerSession) => {
        //         if (error) {
        //             console.log(error);
        //         } else if (!providerSession) {
        //             console.log("todo");
        //         } else {
        //             io.to(providerSession.socketId).emit("downloadFile", socket.id, filePath);
        //         }
        //     });
        // });
    });
};

module.exports = base;