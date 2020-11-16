// Dependencies
const express = require("express");
const path = require("path");

// Imports

// Constants 
const app = express();
const port = 3000;

app.get('/', (_, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

app.get('/style.css', (_, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/style.css'));
});

app.get('/script.js', (_, res) => {
    res.sendFile(path.join(__dirname, '../../frontend/script.js'));
});

app.listen(port, () => {
    console.log(`Listening at http://localhost:${port}`);
});
