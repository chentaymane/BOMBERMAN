// Movement input. queueMove stores a direction; the loop applies it with applyMoves,
// checked against the real map. So a player can never cheat with a position.
const {
  DIRECTIONS, WALL, BLOCK, EMPTY, HOLD_DELAY,
  MAX_POWERUPS, MAX_BOMBS, MAX_RANGE, MAX_SPEED, POWER_BOMB, POWER_FLAME, POWER_SPEED,
} = require('./config')
const state = require('./state')
const { findPlayer, inside, bombAt, isPowerUp, getMoveDelay } = require('./helpers')
// move = 'up' | 'down' | 'left' | 'right' when an arrow key goes down, null when released.
// One press = exactly one step (pendingMove), however long the tap lasts.
// Still held after HOLD_DELAY: the player keeps walking in line (heldMove),
// one step each time the cooldown ends, like a keyboard's own key repeat.
function queueMove(client, move) {
  const player = findPlayer(client)
  if (state.phase !== 'playing' || !player || player.lives <= 0) return
  if (move === null) player.heldMove = null
  else if (typeof move === 'string' && Object.hasOwn(DIRECTIONS, move)) {
    if (move !== player.heldMove) player.walkFrom = Date.now() + HOLD_DELAY
    player.heldMove = move
    player.pendingMove = move
  }
}

// Called by the loop: one step for every player whose cooldown is over
function applyMoves(now) {
  for (const player of state.players) {
    const walking = player.heldMove && now >= player.walkFrom
    const move = player.pendingMove || (walking ? player.heldMove : null)
    if (player.lives <= 0 || !move || now < player.nextMoveAt) continue
    player.pendingMove = null
    tryMove(player, DIRECTIONS[move], now)
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
