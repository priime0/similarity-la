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
        <button class="roombutton" @click="joinRoom">Join Room</button>
        <button class="roombutton" @click="createRoom">Create Room</button>
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
    template: `<button @click="adminStartGame">start game</button>`,
    methods: {
        adminStartGame: function () {
            startGame(this.roomCode);
        }
    }
});

Vue.component("similarity-panel", {
    props: ["similarities"],
    template: 
    `<div id="similarities">
        <h3>Your Most Similar Interests!</h3>
        <p>The lower your score, the more your interests align.</p>
        <ul>
            <li v-for="item in this.similarities" :key="item.name">{{ item.name }} {{ item.distance.toFixed(2) }}</li>
        </ul>
    </div>`
});

Vue.component("clusters-panel", {
    props: ["username", "clusters"],
    template:
    `<div>
        <h3>Clusters!</h3>
        <p>The algorithm best paired you with the following people:</p>
        <ul>
            <li v-for="player in this.getCluster()">{{ player }}</li>
        </ul>
    </div>`,
    methods: {
        getCluster: function () {
            for (let ind = 0; ind < this.clusters.length; ind++) {
                const cluster = this.clusters[ind];
                if (cluster.includes(this.username)) {
                    return cluster.filter(name => name != this.username);
                }
            }
            return [];
        }
    }
});

Vue.component("room", {
    props: ["room", "gamestarted", "gameended", "username", "song", "madechoice", "similarities", "hasclusters", "clusters"],
    data: function () {
        return {
            choicesMade: 0,
        }
    },
    template:
    `<div id="newroom">
        <h2>{{ this.room.code }}</h2>
        <ul>
            <li v-for="user in this.room.users" :key="user.name">{{ user.name }}</li>
        </ul>
        <div v-if="this.username === this.room.admin && !this.gamestarted">
            <admin-panel :roomCode="this.room.code"></admin-panel>
        </div>
        <div v-if="this.gamestarted && !this.gameended">
            <h3>{{ this.song }}</h3>
            <div>
                <button @click="choose(1)">1</button>
                <button @click="choose(2)">2</button>
                <button @click="choose(3)">3</button>
                <button @click="choose(4)">4</button>
                <button @click="choose(5)">5</button>
            </div>
            <p v-if="this.madechoice">Made a choice!</p>
        </div>
        <div v-if="this.gameended">
            <p>Game Ended!</p>
            <similarity-panel :similarities="similarities"></similarity-panel>
        </div>
        <clusters-panel v-if="this.gameended && this.hasclusters"
        :username="username"
        :clusters="clusters"
        >
        </clusters-panel>
    </div>`,
    methods: {
        choose: function (num) {
            if (!this.madechoice) {
                console.log(`Made choice ${num}`);
                this.$emit("choice", true);
                sendChoice(this.username, num);
            }
        }
    },
})

const app = new Vue({
    el: "#app",
    data: {
        username: "",
        roomCode: "",
        error: "",
        inRoom: false,
        song: "",
        madechoice: false,
        room: {},
        similarities: [],
        hasclusters: false,
        clusters: [],
    },
    methods: {
        mchoice: function (choice) {
            this.madechoice = choice;
        }
    },
})

const socket = io();

socket.on("info", room => {
    app.roomCode = room.code;
    app.room = room;
    app.inRoom = true;
    app.error = "";
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
    app.room.gameStarted = true;
    console.log("Game started");
});

socket.on("song-list", songsList => {
    app.room.songsList = songsList;
});

socket.on("make-choice", () => {
    app.madechoice = false;
    app.song = app.room.songsList.shift();
});

socket.on("game-end", room => {
    app.room = room;
    app.room.gameEnded = true;
    getSimilarities()
        .then(similarities => {
            app.similarities = similarities;

            const simsByName = {};
            for (let ind = 0; ind < similarities.length; ind++) {
                const similarity = similarities[ind];
                simsByName[similarity.name] = similarity.distance;
            }

            const info = {
                name: app.username,
                roomCode: app.roomCode,
                similarities: simsByName,
            }

            socket.emit("similarities", info);
        })
        .catch(err => {
            app.error = err;
        });
});

socket.on("clusters", clusters => {
    console.log("clusters");
    console.log(clusters);
    app.clusters = clusters;
    app.hasclusters = true;
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

function sendChoice (username, choice) {
    const info = {
        roomCode: app.roomCode,
        username,
        choice,
    }
    socket.emit("made-choice", info);
}

function getSimilarities () {
    return new Promise((resolve, reject) => {
        const users = app.room.users;
        let playerChoices;
        for (let ind = 0; ind < users.length; ind++) {
            const user = users[ind];
            if (user.name === app.username) {
                playerChoices = user.choices;
            }
        }
        if (playerChoices === null) {
            reject("User does not exist!");
        }

        const similarities = [];
        for (let ind = 0; ind < users.length; ind++) {
            const user = users[ind];
            if (user.name === app.username) {
                continue;
            }

            const distance = calculateDistance(playerChoices, user.choices);

            const item = {
                name: user.name,
                distance,
            }
            similarities.push(item);
        }

        similarities.sort((a, b) => {
            return a.distance - b.distance;
        });

        resolve(similarities)
    });
}

function calculateDistance (vec1, vec2) {
    let distance = 0;
    for (let ind = 0; ind < Math.min(vec1.length, vec2.length); ind++) {
        const diff = vec1[ind] - vec2[ind];
        distance += Math.pow(diff, 2);
    }
    distance = Math.sqrt(distance);

    return distance;
}
