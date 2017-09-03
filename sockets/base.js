module.exports = function (io) {
    io.on("connection", function (socket) {
        console.log(`${socket.id} connected`);
        socket.on("demo", function (msg, metadata) {
            io.emit("render", msg, metadata); // todo: change to emit only to this session
        });
        socket.on("disconnect", function () {
            console.log(`${socket.id} disconnected`);
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