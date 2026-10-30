// The game loop, every 20 ms (TICK). It is the only place where the game moves
// forward: one step at a time, in a fixed order, so two messages can never
// change the game "at the same time". After each step every player gets the
// new 'lobby' or 'state' message, but only if it changed.
const { TICK } = require('./config')
const state = require('./state')
const { checkLobby, startCountdown, startGame } = require('./lobby')
const { applyMoves } = require('./moves')
const { applyPlacements, explodeReadyBombs } = require('./bombs')
const { applyDamage, checkWinner } = require('./lives')
const { currentMessage } = require('./messages')
const { broadcast } = require('./helpers')

function update(now) {
  if (state.phase === 'lobby' && state.waitEndsAt && now >= state.waitEndsAt) startCountdown()
  else if (state.phase === 'countdown' && now >= state.startsAt) startGame()
  else if (state.phase === 'over' && now >= state.overEndsAt) {
    state.phase = 'lobby'
    checkLobby()
  } else if (state.phase === 'playing') {
    applyPlacements(now) // 1. new bombs, independent of movement cooldowns
    applyMoves(now) // 2. movement
    explodeReadyBombs(now) // 3. explosions
    applyDamage(now) // 4. players in the fire lose a life
    checkWinner(now) // 5. last one standing?
  }
}

function tick() {
  const now = Date.now()
  try {
    update(now)
    broadcast(currentMessage(now), { deduplicate: true })
  } catch (err) {
    console.error('tick error:', err) // never crash the server
  }
}

function startLoop() {
  const timer = setInterval(tick, TICK)
  return () => clearInterval(timer)
}

module.exports = { startLoop }
