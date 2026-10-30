// Movement input. queueMove stores a direction; the loop applies it with applyMoves,
// checked against the real map. So a player can never cheat with a position.
const {
  DIRECTIONS, WALL, BLOCK, EMPTY,
  MAX_POWERUPS, MAX_BOMBS, MAX_RANGE, MAX_SPEED, POWER_BOMB, POWER_FLAME, POWER_SPEED,
} = require('./config')
const state = require('./state')
const { findPlayer, inside, bombAt, isPowerUp, getMoveDelay } = require('./helpers')
// move = 'up' | 'down' | 'left' | 'right'
function queueMove(client, move) {
  const player = findPlayer(client)
  if (state.phase !== 'playing' || !player || player.lives <= 0 || typeof move !== 'string') return
  if (Object.hasOwn(DIRECTIONS, move)) player.wantedMove = move // last wish wins
}

// Called by the loop: play the stored wishes of every living player
function applyMoves(now) {
  for (const player of state.players) {
    if (player.lives <= 0) continue

    // Too soon after the last move: keep the wish, try again next tick
    if (player.wantedMove && now >= player.nextMoveAt) {
      tryMove(player, DIRECTIONS[player.wantedMove], now)
      player.wantedMove = null
    }
  }
}

function tryMove(player, [dx, dy], now) {
  const x = player.x + dx
  const y = player.y + dy
  if (!inside(x, y)) return
  const tile = state.tiles[y][x]
  if (tile === WALL || tile === BLOCK || bombAt(x, y)) return

  player.x = x
  player.y = y
  player.nextMoveAt = now + getMoveDelay(player)

  // Walking on a power-up picks it up. After MAX_POWERUPS the extra ones just disappear.
  if (isPowerUp(tile)) {
    state.tiles[y][x] = EMPTY
    if (player.totalPups < MAX_POWERUPS) {
      player.totalPups++
      if (tile === POWER_BOMB) player.maxBombs = Math.min(MAX_BOMBS, player.maxBombs + 1)
      if (tile === POWER_FLAME) player.range = Math.min(MAX_RANGE, player.range + 1)
      if (tile === POWER_SPEED) player.speed = Math.min(MAX_SPEED, player.speed + 1)
    }
  }
}

module.exports = { queueMove, applyMoves }
