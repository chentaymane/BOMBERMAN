// Bombs: dropping them, and the explosion when their time is up.
// Flames go in 4 directions up to the bomb's range and:
//   - stop at walls (nothing happens to the wall)
//   - stop at bricks, which are destroyed (a power-up may appear)
//   - stop at other bombs, which are NOT set off (no chain reaction)
//   - pass over power-ups lying on the ground (they are not burned)
// Players standing in the fire are hurt in lives.js.
const {
  BOMB_TIME, FIRE_TIME, DIRECTIONS, WALL, BLOCK, EMPTY,
  POWER_BOMB, POWER_FLAME, POWER_SPEED,
} = require('./config')
const state = require('./state')
const { inside, bombAt, findPlayer } = require('./helpers')

function queuePlace(client) {
  const player = findPlayer(client)
  if (state.phase !== 'playing' || !player || player.lives <= 0) return
  player.wantsBomb = true
}

// Placement has its own queue and never waits for the movement cooldown.
function applyPlacements(now) {
  for (const player of state.players) {
    if (!player.wantsBomb) continue
    player.wantsBomb = false
    if (player.lives > 0) placeBomb(player, now)
  }
}

// Called by the loop when a player asked for a bomb
function placeBomb(player, now) {
  const myBombs = state.bombs.filter((b) => b.owner === player).length
  if (myBombs >= player.maxBombs || bombAt(player.x, player.y)) return
  state.bombs.push({ x: player.x, y: player.y, owner: player, range: player.range, explodeAt: now + BOMB_TIME })
}

// Called by the loop: every bomb whose time is up explodes
function explodeReadyBombs(now) {
  let ready
  while ((ready = state.bombs.find((b) => now >= b.explodeAt))) explode(ready, now)
}

function explode(bomb, now) {
  state.bombs = state.bombs.filter((b) => b !== bomb)
  const until = now + FIRE_TIME
  state.fireUntil[bomb.y][bomb.x] = until

  for (const [dx, dy] of Object.values(DIRECTIONS)) {
    for (let i = 1; i <= bomb.range; i++) {
      const x = bomb.x + dx * i
      const y = bomb.y + dy * i
      if (!inside(x, y)) break

      const tile = state.tiles[y][x]
      if (tile === WALL) break // solid: the flame stops here

      // A bomb is solid: the flame stops, but does NOT set it off (no chain reaction)
      if (bombAt(x, y)) {
        state.fireUntil[y][x] = until
        break
      }

      state.fireUntil[y][x] = until

      if (tile === BLOCK) {
        state.tiles[y][x] = randomPowerUp() // the brick is destroyed, an item may appear
        break // fire stops at the brick
      }
      // Power-ups are not destroyed: the flame passes over them and keeps going
    }
  }
}

// 10 % chance for each power-up, 70 % nothing
function randomPowerUp() {
  const r = Math.random()
  if (r < 0.1) return POWER_BOMB
  if (r < 0.2) return POWER_FLAME
  if (r < 0.3) return POWER_SPEED
  return EMPTY
}

module.exports = { queuePlace, applyPlacements, placeBomb, explodeReadyBombs }
