const http = require('http')
const { serveFile } = require('./transport/http')
const { startSockets } = require('./transport/websocket')
const { startLoop } = require('./game-logic/loop')

const PORT = process.env.PORT || 8080

const server = http.createServer(serveFile)
startSockets(server)
startLoop()

server.listen(PORT, () => console.log('Server on http://localhost:' + PORT))
