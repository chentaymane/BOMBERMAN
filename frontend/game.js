import { h } from './framework/index.js'

const TILES = { '#': 'wall', B: 'block', X: 'bomb', b: 'power power-bomb', f: 'power power-flame', s: 'power power-speed' }

// The tiles only change when a new map arrives. Otherwise the same vnode
// is returned and the framework skips the whole grid.
let lastMap = null
let lastTiles = null

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
  if (TILES[symbol]) return TILES[symbol]
  // Floor right under a wall or a block gets its shadow
  const above = (map[y - 1] || [])[x]
  return above === '#' || above === 'B' ? 'shade' : ''
}

function tilesView(game) {
  if (game.map === lastMap) return lastTiles
  const bombs = new Set(game.bombs.map((b) => b.x + ',' + b.y))
  const cells = []
  game.map.forEach((row, y) =>
    row.forEach((symbol, x) => cells.push(h('div', { class: 'cell ' + tileClass(game.map, bombs, x, y) }))),
  )
  lastMap = game.map
  lastTiles = h('div', { class: 'tiles', 'aria-hidden': 'true' }, cells)
  return lastTiles
}

// Last drawn position of each player, to spot a respawn (a jump of more than one cell)
const lastPos = {}

// Moved with transform only (--cell is the tile size from style.css).
// The slide lasts as long as the server's move delay: 200 ms, 30 ms less per speed power-up
// (MOVE_DELAY and SPEED_STEP in backend/game.js), so holding a key looks like one smooth walk.
function playerView(p, me) {
  const prev = lastPos[p.id]
  const respawn = prev && Math.abs(prev.x - p.x) + Math.abs(prev.y - p.y) > 1
  lastPos[p.id] = { x: p.x, y: p.y }
  return h('div', {
    key: p.id,
    class: `player c${p.character}${p.safe ? ' safe' : ''}${p.name === me ? ' me' : ''}`,
    style: {
      transform: `translate(calc(${p.x} * var(--cell)), calc(${p.y} * var(--cell)))`,
      transitionDuration: respawn ? '0ms' : 200 - p.speed * 30 + 'ms', // no slide back to the corner
    },
  }, h('span', { class: 'tag' }, p.name))
}

// One card per player above the board: face, name, lives and power-ups
function chipView(p, me) {
  const alive = p.lives > 0
  const info = `${p.bombs} bombs, range ${p.range}, speed ${p.speed}`
  let classes = 'chip'
  if (p.name === me) classes += ' me'
  if (!alive) classes += ' out'
  return h('li', { key: p.id, class: classes },
    h('span', { class: 'avatar c' + p.character }),
    h('span', { class: 'chip-text' },
      h('span', { class: 'chip-top' },
        h('b', {}, p.name === me ? p.name + ' (you)' : p.name),
        alive
          ? h('span', { class: 'hearts', role: 'img', 'aria-label': p.lives + ' lives' }, '❤️'.repeat(p.lives))
          : h('span', { class: 'hearts' }, 'Out'),
      ),
      alive && h('span', { class: 'stats', role: 'img', 'aria-label': info, title: info },
        h('span', {}, '💣 ' + p.bombs),
        h('span', {}, '🔥 ' + p.range),
        h('span', {}, '⚡ ' + p.speed),
      ),
    ),
  )
}

function overView(s, game) {
  const winner = game.players.find((p) => p.name === s.winner)
  let title = 'Nobody Survived'
  if (s.winner === s.me) title = 'You Win!'
  else if (s.winner) title = s.winner + ' Wins!'
  return h('div', { class: 'overlay' },
    h('div', { class: 'result', role: 'alert' },
      winner && h('span', { class: 'avatar c' + winner.character }),
      h('h2', {}, title),
      h('p', { class: 'secondary' }, 'Back to the waiting room in 5 s…'),
    ),
  )
}

// Never changes, so it is built once and the framework always skips it
const hint = h('p', { class: 'hint' },
  h('span', {}, h('kbd', {}, '← ↑ → ↓'), 'Move'),
  h('span', {}, h('kbd', {}, 'Space'), 'Drop a bomb'),
  h('span', {}, h('kbd', {}, 'Esc'), 'Leave the chat'),
)

export function gameView(s) {
  const game = s.game
  const me = game.players.find((p) => p.name === s.me)
  return h('div', { class: 'game' },
    h('ul', { class: 'chips' }, game.players.map((p) => chipView(p, s.me))),
    h('div', { class: 'board' },
      tilesView(game),
      h('div', { class: 'players', 'aria-hidden': 'true' }, game.players.filter((p) => p.lives > 0).map((p) => playerView(p, s.me))),
      me && me.lives === 0 && !s.over && h('div', { class: 'banner' }, "You're out! Watching…"),
      s.over && overView(s, game),
    ),
    h('div', { class: 'game-footer' },
      hint,
      h('span', { class: 'fps', title: 'Frames per second' }, s.fps + ' FPS'),
    ),
  )
}
