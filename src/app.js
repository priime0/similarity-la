// Dependencies
const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
const server = require('http').createServer(app);
const socketOptions = {
    "path": "/socket.io",
}
const io = require('socket.io')(server.listen(port));

const { generateRoomCode } = require("./helpers");

// Hacked database 'cause I'm lazy.
const rooms = {};

app.get('/', (_, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/style.css', (_, res) => {
    res.sendFile(path.join(__dirname, '../frontend/style.css'));
});

app.get('/script.js', (_, res) => {
    res.sendFile(path.join(__dirname, '../frontend/script.js'));
});

io.on('connection', socket => {
    console.log("User connected");

    socket.on('new-room', username => {
        console.log(username);
        console.log("Creating room");
        const roomCode = generateRoomCode();
        socket.join(roomCode);
        const room = {
            users: [{
                name: username,
                choices: [],
            }]
        };
        rooms[roomCode] = room;
        console.log(`Created room with code ${roomCode}`);
        io.to(roomCode).emit("code", roomCode);
        console.log(JSON.stringify(rooms, null, 2));
    });

    socket.on('join-room', info => {
        const { username, roomCode } = info;
        console.log(`${username} joining ${roomCode}`);
        socket.join(roomCode);
        room[roomCode].users.push({
            name: username,
            choices: [],
        });
        io.to(roomCode).emit("code", roomCode);
        console.log(JSON.stringify(rooms, null, 2));
    });
});
