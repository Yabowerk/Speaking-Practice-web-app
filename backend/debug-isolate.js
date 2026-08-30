// Isolate which require() causes the server to unref itself
const http = require('http');

// Track all servers
const servers = [];
const origCreateServer = http.createServer.bind(http);
http.createServer = function(...args) {
    const server = origCreateServer(...args);
    servers.push(server);
    const origListen = server.listen.bind(server);
    const origUnref = server.unref.bind(server);
    server.unref = function() {
        console.log('[DEBUG] unref() called on server!');
        console.trace();
        return origUnref();
    };
    return server;
};

process.on('beforeExit', () => {
    console.log('[DEBUG] beforeExit - checking all servers:');
    servers.forEach((s, i) => {
        console.log(`  Server[${i}]: listening=${s.listening}, _handle=${!!s._handle}`);
    });
});

// Load modules one by one
console.log('Loading dotenv...');
require('dotenv').config();
console.log('Loading dns...');
const dns = require("node:dns");
dns.setDefaultResultOrder("ipv4first");
console.log('Loading express...');
const express = require('express');
const app = express();
console.log('Loading multer...');
const multer = require("multer");
console.log('Loading cors...');
const cors = require("cors");
console.log('Loading convert...');
// const { convertToWav, getAudioDuration } = require("./convert");
console.log('Loading fs...');
const fs = require("fs");
console.log('Loading nodejs-whisper...');
const { nodewhisper } = require("nodejs-whisper");
console.log('Loading path...');
const path = require('path');
console.log('Loading supabase...');
const { supabase } = require('./lib/supabase.js');
console.log('Loading auth middleware...');
const { requireAuth } = require('./middleware/auth.js');
console.log('Loading supabase client...');
const { createClient } = require("@supabase/supabase-js");
console.log('Loading genai...');
const { GoogleGenAI, Type } = require("@google/genai");
console.log('Loading addisai...');
const { AddisAI } = require("addisai");

console.log('All modules loaded. Starting server...');
app.use(express.json());
app.use(cors());
const server = app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
    console.log('server._handle after listen callback:', !!server._handle);
});

// Keep checking handle for 3 seconds
let checks = 0;
const interval = setInterval(() => {
    checks++;
    console.log(`[${checks}s] server.listening=${server.listening}, _handle=${!!server._handle}`);
    if (checks >= 3) clearInterval(interval);
}, 1000);
