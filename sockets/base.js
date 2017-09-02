module.exports = function (io) {
    io.on("connection", function (socket) {
        console.log(`${socket.id} connected`);
        socket.on("demo", function (msg, metadata) {
            console.log("message: " + msg);
            console.log("metadata:");
            console.log(metadata);
            io.emit("render", msg, metadata);
        });
        socket.on("disconnect", function () {
            console.log(`${socket.id} disconnected`);
        });
        socket.on("serverHandshake", function (msg) {
            console.log(msg);
            io.to(socket.id).emit("serverHandshake", `Hello, ${socket.id}, from localhost!`);
            console.log("broadcasted!");
        });
    });
};