// The game loop, every 20 ms (TICK). It is the only place where the game moves
// forward: one step at a time, in a fixed order, so two messages can never
// change the game "at the same time". After each step every player gets the
// new 'lobby' or 'state' message, but only if it changed.
const { TICK } = require('./config')
const state = require('./state')
const { checkLobby, startCountdown, startGame } = require('./lobby')
const { applyInputs } = require('./moves')
const { explodeReadyBombs } = require('./bombs')
const { applyDamage, checkWinner } = require('./lives')
const { currentMessage } = require('./messages')

function update(now) {
  if (state.phase === 'lobby' && state.waitEndsAt && now >= state.waitEndsAt) startCountdown()
  else if (state.phase === 'countdown' && now >= state.startsAt) startGame()
  else if (state.phase === 'over' && now >= state.overEndsAt) {
    state.phase = 'lobby'
    checkLobby()
  } else if (state.phase === 'playing') {
    applyInputs(now) // 1. moves and new bombs
    explodeReadyBombs(now) // 2. explosions
    applyDamage(now) // 3. players in the fire lose a life
    checkWinner(now) // 4. last one standing?
  }
}

function tick() {
  const now = Date.now()
  try {
    update(now)
    const text = JSON.stringify(currentMessage(now)) // built once for everyone
    for (const p of state.players) {
      if (state.lastSent.get(p.client) === text) continue // nothing changed
      state.lastSent.set(p.client, text)
      p.client.send(text)
    }
  } catch (err) {
    console.error('tick error:', err) // never crash the server
  }
}

function startLoop() {
  setInterval(tick, TICK)
}

module.exports = { startLoop }
