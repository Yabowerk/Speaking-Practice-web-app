const originalExit = process.exit;
process.exit = function(code) {
  console.log("process.exit called with code:", code);
  console.log(new Error().stack);
  originalExit.call(process, code);
};
process.on('beforeExit', (code) => {
  console.log('Node is exiting because event loop is empty. Code:', code);
});
require('./server.js');
