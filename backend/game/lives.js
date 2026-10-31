// Lives and the end of a game: fire hurts players, the last one standing wins.
const { CORNERS, SAFE_TIME, OVER_TIME } = require('./config')
const state = require('./state')
const { broadcast } = require('./helpers')

// Called by the loop: every player standing in fire loses a life
function applyDamage(now) {
  for (const player of state.players) {
    if (player.lives <= 0 || now < player.safeUntil || state.fireUntil[player.y][player.x] <= now) continue
    player.lives--
    player.heldMove = null
    player.pendingMove = null
    player.wantsBomb = false
    if (player.lives > 0) {
      // Back to own corner, invincible longer than any fire lasts
      player.x = CORNERS[player.id - 1][0]
      player.y = CORNERS[player.id - 1][1]
      player.safeUntil = now + SAFE_TIME
    }
  }
}

// Called by the loop: one player (or nobody) left alive ends the game
function checkWinner(now) {
  if (state.phase !== 'playing') return
  const alive = state.players.filter((player) => player.lives > 0)
  if (alive.length > 1) return
  state.phase = 'over'
  state.overEndsAt = now + OVER_TIME
  broadcast({ type: 'over', winner: alive.length ? alive[0].name : null })
}

function forfeit(player, now) {
  if (state.phase !== 'playing' || player.lives <= 0) return
  player.lives = 0
  player.forfeited = true
  player.heldMove = null
  player.pendingMove = null
  player.wantsBomb = false
  checkWinner(now)
}

module.exports = { applyDamage, checkWinner, forfeit }
