function generateRoomCode () {
    let code = "";
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let length = 6;
    for (let _ = 0; _ < length; _++) {
        let randChar = characters[Math.floor(Math.random() * characters.length)];
        code += randChar;
    }

    return code;
}

function roomExists (rooms, roomCode) {
    return rooms.hasOwnProperty(roomCode);
}

function createRoom (roomCode, admin) {
    const room = {
        code: roomCode,
        admin,
        gameStarted: false,
        gameEnded: false,
        users: [{
            name: admin,
            choices: [],
        }],
        songsList: [],
        current: 0,
        totalChoices: 0,
    };

    return room;
}

// Algorithm from following SO thread:
// https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
function generateSongList () {
    const MAX_SHOWS = 10;
    const songList = require("./list");
    for (let i = songList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i+1));
        const x = songList[i];
        songList[i] = songList[j];
        songList[j] = x;
    }
    
    return songList.slice(0, MAX_SHOWS);
}

function pprint (json) {
    console.log(JSON.stringify(json, null, 2));
}

module.exports = {
    generateRoomCode,
    roomExists,
    createRoom,
    generateSongList,
    pprint,
}
