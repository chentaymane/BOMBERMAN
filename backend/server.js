// Bomberman backend: the file you start (npm start).
// One server on http://localhost:8080 does two jobs:
//   files.js    sends the frontend files to the browser
//   sockets.js  talks to the players over one WebSocket and passes their messages to the game
// All the game rules are in the game/ folder (start with game/index.js).
const http = require('http')
const { serveFile } = require('./files')
const { startSockets } = require('./sockets')

const PORT = process.env.PORT || 8080

const server = http.createServer(serveFile)
startSockets(server)

server.listen(PORT, () => console.log('Server on http://localhost:' + PORT))
