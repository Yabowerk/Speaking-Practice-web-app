// Test: does the error event fire?
require('dotenv').config();
const dns = require("node:dns");
dns.setDefaultResultOrder("ipv4first");

const http = require('http');
const express = require('express');
const app = express();

const server = app.listen(3000, (err) => {
    if (err) {
        console.log('[listen callback] ERROR:', err);
    } else {
        console.log('[listen callback] Server started, _handle:', !!server._handle, 'listening:', server.listening);
    }
});

server.on('error', (err) => {
    console.log('[server error event]', err.code, err.message);
});

server.on('listening', () => {
    console.log('[listening event] fired! address:', server.address());
});

setTimeout(() => {
    console.log('[1s timeout] listening:', server.listening, '_handle:', !!server._handle);
    if (!server.listening) {
        console.log('[1s timeout] Server is NOT listening. Something went wrong.');
    }
}, 1000);
