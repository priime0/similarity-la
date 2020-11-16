// Dependencies
const express = require("express");
const app = express();
const port = 3000;
const path = require("path");
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

app.get('/', (_, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/style.css', (_, res) => {
    res.sendFile(path.join(__dirname, '../frontend/style.css'));
});

app.get('/script.js', (_, res) => {
    res.sendFile(path.join(__dirname, '../frontend/script.js'));
});

io.on('connect', (socket) => {
    console.log("User connected");
});

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
});
