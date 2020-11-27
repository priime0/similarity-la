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
        users: [{
            name: admin,
            choices: [],
        }],
        showsList: [],
    };

    return room;
}

// https://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array
function generateShowList () {
    const MAX_SHOWS = 10;
    const showList = require("./list");
    for (let i = showList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i+1));
        const x = showList[i];
        showList[i] = showList[j];
        showList[j] = x;
    }
    
    return showList.slice(0, MAX_SHOWS);
}

module.exports = {
    generateRoomCode,
    roomExists,
    createRoom,
    generateShowList,
}
