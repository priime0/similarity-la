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

module.exports = {
    generateRoomCode,
    roomExists,
}
