// Debug script to find why server exits immediately
const http = require('http');

// Monkey-patch to detect unref calls
const origUnref = http.Server.prototype.unref;
http.Server.prototype.unref = function() {
    console.log('[DEBUG] server.unref() called!');
    console.log(new Error().stack);
    return origUnref ? origUnref.apply(this, arguments) : this;
};

process.on('beforeExit', (code) => {
    console.log('[DEBUG] Node.js event loop is now EMPTY. Exiting with code:', code);
    console.log('[DEBUG] This means no active handles/timers kept the process alive.');
});

require('./server.js');
