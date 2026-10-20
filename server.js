// Bomberman backend: one WebSocket on ws://localhost:8080
const http = require('http')
const ws = require('./ws')
const game = require('./game')

const PORT = process.env.PORT || 8080
const MAX_CONNECTIONS = 50
const MAX_MESSAGES_PER_SECOND = 60 // extra messages are ignored
const KICK_MESSAGES_PER_SECOND = 200 // spammer gets disconnected

let connections = 0

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' })
  res.end('Bomberman server running. Connect with WebSocket.')
})

// Messages from the client:
//   { "type": "join", "name": "bob" }
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
    if (msg.type === 'join') game.join(client, msg.name)
    else if (msg.type === 'move') game.queueMove(client, msg.move)
    else if (msg.type === 'chat') game.chat(client, msg.text)
  } catch (err) {
    console.error('message error:', err)
  }
}

function onClose(client) {
  connections--
  game.leave(client)
}

server.on('upgrade', (req, socket, head) => {
  if (connections >= MAX_CONNECTIONS) return socket.destroy()
  const client = ws.accept(req, socket, head, onMessage, onClose)
  if (!client) return
  client.windowStart = 0
  client.count = 0
  connections++
})

server.listen(PORT, () => console.log('Server on http://localhost:' + PORT))
