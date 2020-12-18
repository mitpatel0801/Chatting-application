const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage } = require('./utils/messages');
const { addUser, removeUser, getUser, getUsersInRoom } = require("./utils/users");
const { get } = require('https');


const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicPath = path.join(__dirname, "../public");



io.on("connection", (socket) => {
    console.log("New WebSocket connection");

    socket.on("join", ({ username, room }, callback) => {

        const user = addUser({ id: socket.id, username, room })
        if (user.error) {
            return callback(user.error)
        }

        socket.join(user.room)
        //showing message call to individual user
        socket.emit("message", generateMessage("Welcome!", "Admin"))

        //showing message to other users
        socket.broadcast.to(user.room).emit("message", generateMessage(`${user.username} has joined`, "Admin"))

        io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUsersInRoom(user.room),
        })
    })

    //receiving message then send it
    socket.on("sendMessage", (message, callback) => {
        const filter = new Filter();
        if (filter.isProfane(message)) {
            return callback("profanity is not allowed");
        }
        const user = getUser(socket.id);
        io.to(user.room).emit("message", generateMessage(message, user.username));
        callback()
    })

    //receiving location then sending location
    socket.on("sendLocation", (coords, callback) => {
        const user = getUser(socket.id);
        io.to(user.room).emit("locationMessage", generateMessage(`https://google.com/maps?q=${coords.latitude},${coords.longitude}`, user.username))
        callback();
    })

    //user left message to all
    socket.on("disconnect", () => {

        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit("message", generateMessage(`${user.username} has left!`, "Admin"))

            io.to(user.room).emit("roomData", {
                room: user.room,
                users: getUsersInRoom(user.room),
            })
        }
    })

})

app.use(express.static(publicPath));



server.listen(port, () => {
    console.log("Server is running");
})