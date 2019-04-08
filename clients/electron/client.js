const WebSocket = require('ws')
const ws = new WebSocket(`ws://localhost:${process.env.WEBSOCKET_PORT}`, {
    perMessageDeflate: false
});

module.exports = ws