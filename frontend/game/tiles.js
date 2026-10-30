import { h } from '../framework/index.js'

const TILE_CLASSES = {
  '#': 'wall',
  B: 'block',
  X: 'bomb',
  b: 'power power-bomb',
  f: 'power power-flame',
  s: 'power power-speed',
}

// JSON messages contain fresh arrays even when the visible tiles are unchanged.
// Reuse cell vnodes by their visual class, and the whole grid when possible.
let lastMap = null
let lastBombs = null
let lastTiles = null
let lastClasses = []
let lastCells = []

function tileClass(map, bombs, x, y) {
  // A player standing on a bomb hides it in the map, so use the bombs list
  if (bombs.has(x + ',' + y)) return 'bomb'
  const symbol = map[y][x]
  if (symbol === 'F') {
    // Explosions are drawn as a cross: each arm joins the fire next to it
    const fire = (dx, dy) => (map[y + dy] || [])[x + dx] === 'F'
    const across = fire(-1, 0) || fire(1, 0)
    const down = fire(0, -1) || fire(0, 1)
    if (across && !down) return 'fire h'
    if (down && !across) return 'fire v'
    return 'fire c'
  }
  if (TILE_CLASSES[symbol]) return TILE_CLASSES[symbol]
  // Floor right under a wall or a block gets its shadow
  const above = (map[y - 1] || [])[x]
  return above === '#' || above === 'B' ? 'shade' : ''
}

export function tilesView(game) {
  if (game.map === lastMap && game.bombs === lastBombs) return lastTiles
  const bombs = new Set(game.bombs.map((b) => b.x + ',' + b.y))
  const cells = []
  const classes = []
  let changed = false
  game.map.forEach((row, y) =>
    row.forEach((symbol, x) => {
      const index = cells.length
      const name = 'cell ' + tileClass(game.map, bombs, x, y)
      classes.push(name)
      if (name === lastClasses[index]) cells.push(lastCells[index])
      else {
        changed = true
        cells.push(h('div', { class: name }))
      }
    }),
  )
  lastMap = game.map
  lastBombs = game.bombs
  if (!changed && cells.length === lastCells.length) return lastTiles
  lastClasses = classes
  lastCells = cells
  lastTiles = h('div', { class: 'tiles', 'aria-hidden': 'true' }, cells)
  return lastTiles
}

