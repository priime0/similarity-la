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
    generateSongList,
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

        const songsList = generateSongList();
        rooms[roomCode].songsList = songsList;
        pprint(rooms);
        io.in(roomCode).emit("song-list", songsList);

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
            if (room.current < room.songsList.length - 1) {
                room.current++;
                io.in(roomCode).emit("make-choice");
            }
            else {
                console.log(`Game ended at room ${roomCode}`);
                room.gameEnded = true;
                io.in(roomCode).emit("game-end", room);
                endGame(roomCode);
            }
        }
    });

    socket.on('similarities', info => {
        const { name, roomCode, similarities } = info;
        const room = rooms[roomCode];

        room.matrix[name] = similarities;

        // TODO: Check edge case where the submitted similarities don't
        // have edges to all players.
        if (Object.keys(room.matrix).length === room.players.length) {
            createClusters(roomCode);
        }
    });
});

function endGame (roomCode) {
    const room = rooms[roomCode];
    const players = [];
    for (let ind = 0; ind < room.users.length; ind++) {
        const player = room.users[ind].name;
        players.push(player);
    }
    players.sort();

    room.players = players;
}

function createClusters (roomCode) {
    const room = rooms[roomCode];
    const adjacencyMatrix = createAdjMatrix(roomCode);
    const diagonalMatrix = createDiagMatrix(adjacencyMatrix);
}

function createAdjMatrix (roomCode) {
    const room = rooms[roomCode];
    const players = room.players;
    const adjacencyMatrix = [];
    const EDGE_THRESHOLD = 10;
    for (let row = 0; row < players.length; row++) {
        const currRow = room.matrix[players[row]];
        const matrixRow = [];
        for (let col = 0; col < players.length; col++) {
            if (row === col) {
                matrixRow.push(0);
            }
            else {
                if (currRow.hasOwnProperty(players[col])) {
                    const inversedEdge = currRow[players[col]];
                    if (inversedEdge < EDGE_THRESHOLD) {
                        const edge = EDGE_THRESHOLD - inversedEdge;
                        matrixRow.push(edge);
                    }
                    else {
                        matrixRow.push(0);
                    }
                }
                else {
                    matrixRow.push(0);
                }
            }
        }
        adjacencyMatrix.push(matrixRow);
    }

    return adjacencyMatrix;
}

function createDiagMatrix (adjacencyMatrix) {
    const entries = [];
    for (let row = 0; row < adjacencyMatrix.length; row++) {
        let count = 0;
        for (let col = 0; col < adjacencyMatrix[row].length; col++) {
            if (adjacencyMatrix[row][col] != 0) {
                count++;
            }
        }
        entries.push(count);
    }

    const diagonalMatrix = [];
    for (let row = 0; row < adjacencyMatrix.length; row++) {
        const matrixRow = [];
        for (let col = 0; col < adjacencyMatrix[col].length; col++) {
            if (row === col) {
                matrixRow.push(entries[row]);
            }
            else {
                matrixRow.push(0);
            }
        }
        diagonalMatrix.push(matrixRow);
    }

    return diagonalMatrix;
}
