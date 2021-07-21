const usersLogic = require('./logic/users-logic');

function handleSocketsIO(server) {
    const http = require('http').createServer(server);
    const io = require('socket.io')(http);
    const socketIOCache = require('./socketIOCache');

    io.on('connection', (socket) => {
        let userId = getUserId(socket);

        socketIOCache.set(userId, socket);
        console.log("user id " + userId + " is now connected. Total clients online: " + socketIOCache.size);

        socket.on('add-vacation', (newVacation) => {
            socket.broadcast.emit('add-vacation', newVacation);
        })

        socket.on('update-vacation', (vacation) => {
            socket.broadcast.emit('update-vacation', vacation);
        })

        socket.on('delete-vacation', (vacation) => {
            socket.broadcast.emit('delete-vacation', vacation);
        })

        socket.on('follow-vacation', (vacation) => {
            socket.broadcast.emit('follow-vacation', vacation);
        })

        socket.on('unfollow-vacation', (vacation) => {
            socket.broadcast.emit('unfollow-vacation', vacation);
        })

        socket.on('disconnect', () => {
            socketIOCache.delete(userId);
            console.log("user id " + userId + " disconnected. Total clients online: " + socketIOCache.size);
        })
    })

    http.listen(3002, () => {
        console.log('Socket.IO is listening on port 3002');
    })
}

function getUserId(socket) {
    let handshakeData = socket.request;
    let userToken = handshakeData._query['token'];

    let userDetails = usersLogic.getUserDetails(userToken);
    let userId = userDetails.id;
    return userId;
}

module.exports = handleSocketsIO;