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

const { 
    generateRoomCode,
    roomExists,
    createRoom,
    generateShowList,
    pprint,
} = require("./helpers");

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
        const room = createRoom(roomCode, username);
        rooms[roomCode] = room;
        console.log(`Created room with code ${roomCode}`);
        socket.join(roomCode);
        socket.emit("info", room);
        pprint(rooms);
    });

    socket.on('join-room', info => {
        const { username, roomCode } = info;
        console.log(`${username} request to join ${roomCode}`);

        if (!roomExists(rooms, roomCode)) {
            socket.emit("join-error", "Invalid room code!");
            return;
        }
        const room = rooms[roomCode];

        if (room.gameStarted) {
            socket.emit("join-error", "Game already in play!");
            return;
        }

        for (let ind = 0; ind < room.users.length; ind++) {
            const user = room.users[ind];
            if (user.name === username) {
                socket.emit("join-error", "Username already in use!");
                return;
            }
        }

        console.log(`${username} joined ${roomCode}`);

        socket.join(roomCode);
        rooms[roomCode].users.push({
            name: username,
            choices: [],
        });
        socket.emit("info", room);
        socket.broadcast.to(roomCode).emit("player-join", username);
        pprint(rooms);
    });

    socket.on('start-game', roomCode => {
        rooms[roomCode].gameStarted = true;
        io.to(roomCode).emit('game-start');

        const showsList = generateShowList();
        rooms[roomCode].showsList = showsList;
        pprint(rooms);
        io.in(roomCode).emit("show-list", showsList);

        io.in(roomCode).emit("make-choice");
    });

    socket.on('made-choice', info => {
        const { roomCode, username, choice } = info;
        pprint(info);
        const room = rooms[roomCode];
        for (let ind = 0; ind < room.users.length; ind++) {
            const user = room.users[ind];
            if (user.name === username) {
                user.choices.push(choice);
                room.totalChoices++;
            }
        }

        if (room.totalChoices === room.users.length) {
            room.totalChoices = 0;
            if (room.current < room.showsList.length) {
                room.current++;
                io.in(roomCode).emit("make-choice");
            }
            else {
                // End Game, Calculate Stuff
            }
        }
    });
});
