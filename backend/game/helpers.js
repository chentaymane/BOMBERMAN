// Small functions used by several game files.
const {
  WIDTH, HEIGHT, POWER_BOMB, POWER_FLAME, POWER_SPEED, MOVE_DELAY, SPEED_STEP,
} = require('./config')
const state = require('./state')

function send(client, message) {
  client.send(JSON.stringify(message))
}

function broadcast(message, { deduplicate = false } = {}) {
  const text = JSON.stringify(message)
  for (const player of state.players) {
    if (!player.connected) continue
    if (deduplicate && state.lastSent.get(player.client) === text) continue
    if (deduplicate) state.lastSent.set(player.client, text)
    player.client.send(text)
  }
}

function findPlayer(client) {
  return state.players.find((player) => player.client === client)
}

function inside(x, y) {
  return x >= 0 && y >= 0 && x < WIDTH && y < HEIGHT
}

function bombAt(x, y) {
  return state.bombs.find((b) => b.x === x && b.y === y)
}

function isPowerUp(tile) {
  return tile === POWER_BOMB || tile === POWER_FLAME || tile === POWER_SPEED
}

function cleanText(text, max) {
  // Remove invisible control characters, keep normal text
  return text
    .replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e]/g, '')
    .trim()
    .slice(0, max)
}

function getMoveDelay(player) {
  return MOVE_DELAY - player.speed * SPEED_STEP
}

module.exports = { send, broadcast, findPlayer, inside, bombAt, isPowerUp, cleanText, getMoveDelay }
