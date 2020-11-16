Vue.component("lobby", {
    data: function () {
        return {
            username: "",
            roomCode: "",
            invalidName: false,
        }
    },
    template: 
    `<div id="join-room">
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
    data: function () {
        return {
            choices: []
        }
    },
    template: ``,
    methods: {

    },
})

const app = new Vue({
    el: "#app",
    data: {
        username: "",
        inRoom: false,
        roomCode: "",
    },
})

const socket = io();

socket.on("code", roomCode => {
    console.log(`Room Code: ${roomCode}`);
    app.roomCode = roomCode;
    app.inRoom = true;
});

function requestNewRoom (username) {
    socket.emit("new-room", username);
    app.username = username;
}

function joinRoom (username) {
    const info = {
        username,
        roomCode,
    }
    socket.emit("join-room", info);
    app.username = username;
}
