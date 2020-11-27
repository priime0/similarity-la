Vue.component("lobby", {
    data: function () {
        return {
            username: "",
            roomCode: "",
            invalidName: false,
        }
    },
    template: 
    `<div id="joinroom">
    <input id="nameinput" maxlength="12" v-model="username" placeholder="Name" oninput="let p=this.selectionStart;this.value=this.value.toUpperCase();this.setSelectionRange(p, p);">
    <input id="roomcodeinput" maxlength="6" v-model="roomCode" placeholder="Room Code" oninput="let p=this.selectionStart;this.value=this.value.toUpperCase();this.setSelectionRange(p, p);">
    <div id="roombuttons">
        <button class="roombutton" v-on:click="joinRoom">Join Room</button>
        <button class="roombutton" v-on:click="createRoom">Create Room</button>
    </div>
    <p v-if="invalidName">Make your name longer :(</p>
    </div>`,
    methods: {
        joinRoom: function () {
            const MIN_LENGTH = 3;
            if (this.username.length < MIN_LENGTH) {
                this.invalidName = true;
                return;
            }
            this.invalidName = false;
            console.log(`join room ${this.roomCode}`);
            requestJoinRoom(this.username, this.roomCode);
        },
        createRoom: function () {
            const MIN_LENGTH = 3;
            if (this.username.length <= MIN_LENGTH) {
                this.invalidName = true;
                return;
            }
            this.invalidName = false;
            console.log(`create room`);
            requestNewRoom(this.username);
        },
    }
});

Vue.component("admin-panel", {
    props: ["roomCode"],
    template: `<button v-on:click="adminStartGame">start game</button>`,
    methods: {
        adminStartGame: function () {
            startGame(this.roomCode);
        }
    }
});

Vue.component("room", {
    props: ["room", "gamestarted", "username", "show"],
    data: function () {
        return {
            options: [],
        }
    },
    template:
    `<div id="newroom">
        <h2>{{ this.room.code }}</h2>
        <ul>
            <li v-for="user in this.room.users">{{ user.name }}</li>
        </ul>
        <div v-if="this.username === this.room.admin && !this.gamestarted">
            <admin-panel :roomCode="this.room.code"></admin-panel>
        </div>
        <div v-if="this.gamestarted">
            <h3>{{ this.show }}</h3>
            <div>
                <button>1</button>
                <button>2</button>
                <button>3</button>
                <button>4</button>
                <button>5</button>
            </div>
        </div>
    </div>`,
    methods: {

    },
})

const app = new Vue({
    el: "#app",
    data: {
        username: "",
        roomCode: "",
        error: "",
        inRoom: false,
        gameStarted: false,
        show: "",
        room: {},
    },
})

const socket = io();

socket.on("info", room => {
    const { code, users } = room;
    app.roomCode = code;
    app.room = room;
    app.inRoom = true;
});

socket.on("join-error", error => {
    console.log(`Error joining: ${error}`);
    app.error = error;
});

socket.on("player-join", username => {
    app.room.users.push({
        name: username,
        choices: []
    });
});

socket.on("game-start", () => {
    app.gameStarted = true;
    app.room.gameStarted = true;
    console.log("Game started");
});

socket.on("show-list", showsList => {
    app.room.showsList = showsList;
});

socket.on("make-choice", () => {
    app.show = app.room.showsList.shift();
});

function requestNewRoom (username) {
    socket.emit("new-room", username);
    app.username = username;
}

function requestJoinRoom (username, roomCode) {
    const info = {
        username,
        roomCode,
    }
    socket.emit("join-room", info);
    app.username = username;
}

function startGame (roomCode) {
    socket.emit("start-game", roomCode);
}
