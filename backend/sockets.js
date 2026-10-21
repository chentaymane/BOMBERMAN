// WebSocket part of the server: accepts the players' connections, protects the
// server (message size, messages per second, number of connections) and passes
// every valid message to the game. The ws library does the WebSocket handshake.
const { WebSocketServer } = require('ws')
const game = require('./game')

const MAX_CONNECTIONS = 50
const MAX_MESSAGE_SIZE = 4096 // bigger messages close the connection
const MAX_MESSAGES_PER_SECOND = 60 // extra messages are ignored
const KICK_MESSAGES_PER_SECOND = 200 // spammer gets disconnected

// Messages from the client (all explained in API.md):
//   { "type": "join", "name": "bob" }                       (character is optional)
//   { "type": "join", "name": "bob", "character": 2 }
//   { "type": "pick", "character": 3 }                      (waiting room only)
//   { "type": "move", "move": "up" | "down" | "left" | "right" | "bomb" }
//   { "type": "chat", "text": "hello" }
function onMessage(client, text) {
  // Rate limit: count the messages of this client in the current second
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
    return // not JSON: ignored
  }
  if (!msg || typeof msg !== 'object' || Array.isArray(msg)) return

  try {
    if (msg.type === 'join') game.join(client, msg.name, msg.character)
    else if (msg.type === 'pick') game.pick(client, msg.character)
    else if (msg.type === 'move') game.queueMove(client, msg.move)
    else if (msg.type === 'chat') game.chat(client, msg.text)
  } catch (err) {
    console.error('message error:', err) // never crash the server
  }
}

// Plug the WebSocket into the HTTP server (same port)
function startSockets(server) {
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
}

module.exports = { startSockets }
