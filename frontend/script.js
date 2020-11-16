Vue.component("lobby", {
    data: function () {
        return {
            roomCode: "",
        }
    },
    template: 
    `<div id="join-room">
    <input id="roomcodeinput" maxlength="6" v-model="roomCode" placeholder="Room Code">
    <div id="roombuttons">
        <button class="roombutton" v-on:click="joinRoom">Join Room</button>
        <button class="roombutton" v-on:click="createRoom">Create Room</button>
    </div>
    </div>`,
    methods: {
        joinRoom: function () {
            console.log(`join room ${this.roomCode}`);
        },
        createRoom: function () {
            console.log(`create room`);
        },
    }
});

const app = new Vue({
    el: "#app",
    data: {
        inRoom: false,
        lobbyCode: "",
        joinRoomCode: "",
    },
})

console.log("Test");
