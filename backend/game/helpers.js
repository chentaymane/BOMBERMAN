// Small functions used by several game files.
const { WIDTH, HEIGHT, POWER_BOMB, POWER_FLAME, POWER_SPEED } = require('./config')
const state = require('./state')

// Send one message to one player
function send(client, message) {
  client.send(JSON.stringify(message))
}

// Send one message to every player
function broadcast(message) {
  const text = JSON.stringify(message)
  for (const p of state.players) p.client.send(text)
}

// The player using this connection, or undefined if it did not join
function findPlayer(client) {
  return state.players.find((p) => p.client === client)
}

// Is (x, y) on the map?
function inside(x, y) {
  return x >= 0 && y >= 0 && x < WIDTH && y < HEIGHT
}

// The bomb on (x, y), or undefined
function bombAt(x, y) {
  return state.bombs.find((b) => b.x === x && b.y === y)
}

function isPowerUp(tile) {
  return tile === POWER_BOMB || tile === POWER_FLAME || tile === POWER_SPEED
}

function cleanText(text, max) {
  // Remove invisible control characters, keep normal text
  return text.replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e]/g, '').trim().slice(0, max)
}

module.exports = { send, broadcast, findPlayer, inside, bombAt, isPowerUp, cleanText }
