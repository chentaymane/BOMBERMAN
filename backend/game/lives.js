// Lives and the end of a game: fire hurts players, the last one standing wins.
const { CORNERS, SAFE_TIME, OVER_TIME } = require('./config')
const state = require('./state')
const { broadcast } = require('./helpers')

// Called by the loop: every player standing in fire loses a life
function applyDamage(now) {
  for (const p of state.players) {
    if (p.lives <= 0 || now < p.safeUntil || state.fireUntil[p.y][p.x] <= now) continue
    p.lives--
    p.wantedMove = null
    p.wantsBomb = false
    if (p.lives > 0) {
      // Back to own corner, invincible longer than any fire lasts
      p.x = CORNERS[p.id - 1][0]
      p.y = CORNERS[p.id - 1][1]
      p.safeUntil = now + SAFE_TIME
    }
  }
}

// Called by the loop: one player (or nobody) left alive ends the game
function checkWinner(now) {
  const alive = state.players.filter((p) => p.lives > 0)
  if (alive.length > 1) return
  state.phase = 'over'
  state.overEndsAt = now + OVER_TIME
  broadcast({ type: 'over', winner: alive.length ? alive[0].name : null })
}

module.exports = { applyDamage, checkWinner }
