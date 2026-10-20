// Bomberman backend: serves the frontend and one WebSocket on http://localhost:8080
const http = require('http')
const fs = require('fs')
const path = require('path')
const { WebSocketServer } = require('ws')
const game = require('./game')

const PORT = process.env.PORT || 8080
const MAX_CONNECTIONS = 50
const MAX_MESSAGE_SIZE = 4096 // bigger messages close the connection
const MAX_MESSAGES_PER_SECOND = 60 // extra messages are ignored
const KICK_MESSAGES_PER_SECOND = 200 // spammer gets disconnected
const FRONTEND = path.join(__dirname, '..', 'frontend')
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webp': 'image/webp' }

// Send the frontend files (only html, js, css and images from the frontend folder)
const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0]
  const file = path.join(FRONTEND, url === '/' ? 'index.html' : url)
  const type = TYPES[path.extname(file)]
  if (!type || !file.startsWith(FRONTEND + path.sep)) {
    res.writeHead(404)
    return res.end('Not found')
  }
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404)
      return res.end('Not found')
    }
    res.writeHead(200, { 'Content-Type': type })
    res.end(data)
  })
})

// Messages from the client:
//   { "type": "join", "name": "bob", "character": 2 }
//   { "type": "move", "move": "up" | "down" | "left" | "right" | "bomb" }
//   { "type": "chat", "text": "hello" }
function onMessage(client, text) {
  // Rate limit
  const now = Date.now()
  if (now - client.windowStart >= 1000) {
    client.windowStart = now
    client.count = 0
  }
  client.count++
  if (client.count > KICK_MESSAGES_PER_SECOND) return client.close(1008)
  if (client.count > MAX_MESSAGES_PER_SECOND) return

  let msg
  try {
    msg = JSON.parse(text)
  } catch {
    return
  }
  if (!msg || typeof msg !== 'object' || Array.isArray(msg)) return

  try {
    if (msg.type === 'join') game.join(client, msg.name, msg.character)
    else if (msg.type === 'move') game.queueMove(client, msg.move)
    else if (msg.type === 'chat') game.chat(client, msg.text)
  } catch (err) {
    console.error('message error:', err)
  }
}

// The ws library does the WebSocket handshake and reads the messages for us
const wss = new WebSocketServer({ server, maxPayload: MAX_MESSAGE_SIZE })

wss.on('connection', (client) => {
  if (wss.clients.size > MAX_CONNECTIONS) return client.terminate()
  client.windowStart = 0
  client.count = 0
  client.on('message', (data, isBinary) => {
    if (!isBinary) onMessage(client, data.toString())
  })
  client.on('close', () => game.leave(client))
  client.on('error', () => {}) // bad or too big message: ws closes the connection itself
})

server.listen(PORT, () => console.log('Server on http://localhost:' + PORT))
