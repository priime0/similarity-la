Vue.component("lobby", {
    data: function () {
        return {
            roomCode: "",
        }
    },
    template: 
    `<div id="join-room">
    <div>
        <input v-model="roomCode" placeholder="Room Code">
    </div>
    <div>
        <button v-on:click="joinRoom">Join Room</button>
        <button v-on:click="createRoom">Create Room</button>
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
