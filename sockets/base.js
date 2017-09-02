module.exports = function (io) {
    // io stuff here... io.on('conection.....
    io.on('connection', function (socket) {
        console.log(`${socket.id} connected`);
        socket.on('demo', function (msg) {
            console.log('message: ' + msg);
        });
        socket.on('disconnect', function () {
            console.log(`${socket.id} disconnected`);
        });
        socket.on('serverHandshake', function (msg) {
            console.log(msg);
            // socket.to(socket.id).emit('serverHandshake', `Hello, ${socket.id}, from localhost!`);
            io.to(socket.id).emit('serverHandshake', `Hello, ${socket.id}, from localhost!`);
            console.log("broadcasted!");
        });
    });
}