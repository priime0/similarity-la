// Dependencies
const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
const server = require('http').createServer(app);
const io = require('socket.io')(server.listen(port));
const math = require("mathjs");

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

    socket.on('similarities', async info => {
        const { name, roomCode, similarities } = info;
        const room = rooms[roomCode];

        room.matrix[name] = similarities;

        // TODO: Check edge case where the submitted similarities don't
        // have edges to all players.
        if (Object.keys(room.matrix).length === room.players.length) {
            let clusters = await getClusters(roomCode);
            io.in(roomCode).emit("clusters", clusters);
            deleteRoom(roomCode);
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

async function getClusters (roomCode) {
    const room = rooms[roomCode];
    const players = room.players;
    const adjacencyMatrix = createAdjMatrix(roomCode);
    const diagonalMatrix = createDiagMatrix(adjacencyMatrix);

    const laplacianMatrix = createLapMatrix(adjacencyMatrix, diagonalMatrix);

    return getEigenStuff(laplacianMatrix)
        .then(eigenStuff => {
            eigenStuff.sort((a, b) => {
                a.value - b.value;
            });

            console.log(eigenStuff);

            const clusters = createClusters(players, eigenStuff);
            return clusters;
        })
        .catch(error => {
            console.log(error);
        });
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
        for (let col = 0; col < adjacencyMatrix[row].length; col++) {
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

function createLapMatrix (adjacencyMatrix, diagonalMatrix) {
    return math.matrix(math.add(adjacencyMatrix, diagonalMatrix));
}

function getEigenStuff (laplacianMatrix) {
    return new Promise((resolve, reject) => {
        const unorderedEigen = math.eigs(laplacianMatrix);
        console.log(unorderedEigen);
        const eigenArr = [];

        for (let ind = 0; ind < unorderedEigen.values._data.length; ind++) {
            const eigenStuff = {
                value: unorderedEigen.values._data[ind],
                vector: unorderedEigen.vectors._data[ind],
            };
            eigenArr.push(eigenStuff);
        }

        resolve(eigenArr);
    });
}

function createClusters (players, eigenStuff) {
    const fiedlerVector = eigenStuff[0].vector;
    console.log("Fiedler Vector");
    console.log(fiedlerVector);
    const groupings = [];
    const group1 = [];
    const group2 = [];
    for (let ind = 0; ind < fiedlerVector.length; ind++) {
        const entry = fiedlerVector[ind];
        const player = players[ind];
        console.log(player);
        if (entry >= 0) {
            group1.push(player);
        }
        else {
            group2.push(player);
        }
    }

    groupings.push(group1);
    groupings.push(group2);

    return groupings;
}

function deleteRoom (roomCode) {
    delete room[roomCode];
}
