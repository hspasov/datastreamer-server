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
                    console.log("todo");
                } else if (streamSessions.length == 1) {
                    socket.join(streamSessions[0].socketId);
                    io.to(socket.id).emit("connectToProviderSuccess");
                }
            });
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
            io.to(receiver).emit("receiveData", metadata); // todo: change to emit only to this session
        });
        socket.on("serverHandshake", function (msg) {
            io.to(socket.id).emit("serverHandshake", `Hello, ${socket.id}, from localhost!`);
        });
        socket.on("opendirClient", function (selectedDir) {
            console.log(`triggered by ${socket.id}`);
            io.emit("opendirProvider", selectedDir); // todo: change to emit only to this session
        });
    });
};