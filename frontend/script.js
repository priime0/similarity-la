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
            if (this.username.length <= 5) {
                this.invalidName = true;
                return;
            }
            this.invalidName = false;
            console.log(`join room ${this.roomCode}`);
            requestJoinRoom(this.username, this.roomCode);
        },
        createRoom: function () {
            if (this.username.length <= 5) {
                this.invalidName = true;
                return;
            }
            this.invalidName = false;
            console.log(`create room`);
            requestNewRoom(this.username);
        },
    }
});

Vue.component("room", {
    props: ["room", "gameStarted"],
    data: function () {
        return {
            options,
        }
    },
    template:
    `<div id="newroom">
        <h2>{{ room.code }}</h2>
        <ul>
            <li v-for="user in room.users">{{ user.name }}</li>
        </ul>
    </div>`,
    methods: {

    },
})

const app = new Vue({
    el: "#app",
    data: {
        username: "",
        inRoom: false,
        gameStarted: false,
        roomCode: "",
        error: "",
        room: {},
    },
})

const socket = io();

socket.on("info", room => {
    const { code, users } = room;
    app.roomCode = code;
    app.room = room;
    app.inRoom = true;
    app.gameStarted = true;
});

socket.on("join-error", error => {
    console.log(`Error joining: ${error}`);
    app.error = error;
});

socket.on("playerjoin", username => {
    app.room.users.push({
        name: username,
        choices: []
    });
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
