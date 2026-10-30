// The map: a new random one for every game, and the grid sent to the browsers.
const { WIDTH, HEIGHT, EMPTY, WALL, BLOCK, BOMB, FIRE, CORNERS } = require('./config')
const state = require('./state')

// Keep two cells along each corner corridor clear: the first neighbour is
// still inside a starting bomb's range, so players must be able to go farther.
function nearCorner(x, y) {
  return CORNERS.some(([cx, cy]) => Math.abs(cx - x) + Math.abs(cy - y) <= 2)
}

// Walls on the border and on every second cell (always the same),
// blocks at random everywhere else except near the corners
function createMap() {
  const tiles = []
  const fireUntil = []
  for (let y = 0; y < HEIGHT; y++) {
    const row = []
    for (let x = 0; x < WIDTH; x++) {
      const border = x === 0 || y === 0 || x === WIDTH - 1 || y === HEIGHT - 1
      const pillar = x % 2 === 0 && y % 2 === 0
      if (border || pillar) row.push(WALL)
      else if (!nearCorner(x, y) && Math.random() < 0.7) row.push(BLOCK)
      else row.push(EMPTY)
    }
    tiles.push(row)
    fireUntil.push(new Array(WIDTH).fill(0))
  }
  state.tiles = tiles
  state.fireUntil = fireUntil
}

// The matrix sent to clients: tiles + fire + bombs + players, map[y][x]
function buildMatrix(now) {
  const matrix = state.tiles.map((row, y) => row.map((tile, x) => (state.fireUntil[y][x] > now ? FIRE : tile)))
  for (const b of state.bombs) matrix[b.y][b.x] = BOMB
  for (const player of state.players) if (player.lives > 0) matrix[player.y][player.x] = String(player.id)
  return matrix
}

module.exports = { createMap, buildMatrix }
