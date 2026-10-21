// Player input. The browser only says what the player WANTS to do (a direction
// or a bomb). queueMove stores the wish; the loop plays it with applyInputs,
// checked against the real map. So a player can never cheat with a position.
const {
  DIRECTIONS, MOVE_DELAY, SPEED_STEP, WALL, BLOCK, EMPTY,
  MAX_POWERUPS, MAX_BOMBS, MAX_RANGE, MAX_SPEED, POWER_BOMB, POWER_FLAME, POWER_SPEED,
} = require('./config')
const state = require('./state')
const { findPlayer, inside, bombAt, isPowerUp } = require('./helpers')
const { placeBomb } = require('./bombs')

// move = 'up' | 'down' | 'left' | 'right' | 'bomb' (only stored here)
function queueMove(client, move) {
  const p = findPlayer(client)
  if (state.phase !== 'playing' || !p || p.lives <= 0 || typeof move !== 'string') return
  if (move === 'bomb') p.wantsBomb = true
  else if (Object.hasOwn(DIRECTIONS, move)) p.wantedMove = move // last wish wins
}

// Called by the loop: play the stored wishes of every living player
function applyInputs(now) {
  for (const p of state.players) {
    if (p.lives <= 0) continue

    if (p.wantsBomb) {
      p.wantsBomb = false
      placeBomb(p, now)
    }

    // Too soon after the last move: keep the wish, try again next tick
    if (p.wantedMove && now >= p.nextMoveAt) {
      tryMove(p, DIRECTIONS[p.wantedMove], now)
      p.wantedMove = null
    }
  }
}

function tryMove(p, [dx, dy], now) {
  const x = p.x + dx
  const y = p.y + dy
  if (!inside(x, y)) return
  const tile = state.tiles[y][x]
  if (tile === WALL || tile === BLOCK || bombAt(x, y)) return

  p.x = x
  p.y = y
  p.nextMoveAt = now + MOVE_DELAY - p.speed * SPEED_STEP

  // Walking on a power-up picks it up. After MAX_POWERUPS the extra ones just disappear.
  if (isPowerUp(tile)) {
    state.tiles[y][x] = EMPTY
    if (p.totalPups < MAX_POWERUPS) {
      p.totalPups++
      if (tile === POWER_BOMB) p.maxBombs = Math.min(MAX_BOMBS, p.maxBombs + 1)
      if (tile === POWER_FLAME) p.range = Math.min(MAX_RANGE, p.range + 1)
      if (tile === POWER_SPEED) p.speed = Math.min(MAX_SPEED, p.speed + 1)
    }
  }
}

module.exports = { queueMove, applyInputs }
