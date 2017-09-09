var streamSessionActions = require("../actions/streamSession");

var createNewStreamSession = streamSessionActions.createNewStreamSession;
var findStreamSessions = streamSessionActions.findStreamSessions;
var viewAllStreamSessions = streamSessionActions.viewAllStreamSessions;
var updateStreamSession = streamSessionActions.updateStreamSession;
var deleteStreamSession = streamSessionActions.deleteStreamSession;

module.exports = function (io) {
    io.on("connection", function (socket) {
        createNewStreamSession(socket.id, socket.handshake.query["type"], socket.handshake.query["id"], function (error, sessionInfo) {
            if (error) {
                console.log(error);
            } else {
                console.log(`${socket.id} connected`);
                console.log(sessionInfo);
                console.log(Object.keys(io.sockets.sockets).length);
            }
        });
        socket.on("disconnect", function () {
            deleteStreamSession(socket.id, function (error, sessionInfo) {
                if (error) {
                    console.log(error);
                } else {
                    console.log(`${socket.id} disconnected`);
                    console.log(Object.keys(io.sockets.sockets).length);
                    if (sessionInfo.type == "provider") {
                        findStreamSessions("client", sessionInfo.providerId, function (error, streamSessions) {
                            if (error) {
                                console.log(error);
                            }
                            streamSessions.forEach(function (client) {
                                io.to(client.socketId).emit("connectToProviderFail");
                            });
                        });
                    }
                }
            });
        });
        socket.on("connectToProvider", function (providerId) {
            findStreamSessions("provider", providerId, function (error, streamSessions) {
                if (error) {
                    console.log(error);
                } else if (streamSessions.length > 1) {
                    console.log("ERROR: multiple providers in database with the same providerId");
                    console.log(streamSessions);
                } else if (streamSessions.length == 0) {
                    io.to(socket.id).emit("connectToProviderFail");
                } else if (streamSessions.length == 1) {
                    socket.join(streamSessions[0].socketId);
                    io.to(socket.id).emit("connectToProviderSuccess");
                }
            });
        });

        socket.on("connectToClients", function (providerId) {
            findStreamSessions("client", providerId, function (error, streamSessions) {
                if (error) {
                    console.log(error);
                }
                streamSessions.forEach(function (client) {
                    io.to(client.socketId).emit("providerFound");
                });
            })
        });

        socket.on("getAllData", function (providerId) {
            findStreamSessions("provider", providerId, function (error, streamSessions) {
                if (error) {
                    console.log(error);
                } else if (streamSessions.length > 1) {
                    console.log("ERROR: multiple providers in database with the same providerId");
                    console.log(streamSessions);
                } else if (streamSessions.length == 0) {
                    console.log("todo");
                } else if (streamSessions.length == 1) {
                    io.to(streamSessions[0].socketId).emit("getAllData", socket.id);
                }
            });
        });

        socket.on("sendData", function (receiver, metadata) {
            if (!receiver) {
                io.to(socket.id).emit("receiveData", metadata);
            } else {
                io.to(receiver).emit("receiveData", metadata);
            }
        });

        socket.on("openDirectory", function (providerId, selectedDirectory) {
            findStreamSessions("provider", providerId, function (error, streamSessions) {
                if (error) {
                    console.log(error);
                } else if (streamSessions.length > 1) {
                    console.log("ERROR: multiple providers in database with the same providerId");
                    console.log(streamSessions);
                } else if (streamSessions.length == 0) {
                    console.log("todo");
                } else if (streamSessions.length == 1) {
                    io.to(streamSessions[0].socketId).emit("openDirectory", socket.id, selectedDirectory);
                }
            });
        });
    });
};