import { h } from './framework/index.js'

const TILES = { '#': 'wall', B: 'block', X: 'bomb', F: 'fire', b: 'power-bomb', f: 'power-flame', s: 'power-speed' }

const initial = (name) => name.charAt(0).toUpperCase()

// The tiles only change when a new map arrives. Otherwise the same vnode
// is returned and the framework skips the whole grid.
let lastMap = null
let lastTiles = null

function tilesView(game) {
  if (game.map === lastMap) return lastTiles
  // A player standing on a bomb hides it in the map, so use the bombs list
  const bombs = new Set(game.bombs.map((b) => b.x + ',' + b.y))
  const cells = []
  game.map.forEach((row, y) =>
    row.forEach((symbol, x) => {
      const tile = bombs.has(x + ',' + y) ? 'bomb' : TILES[symbol] || ''
      cells.push(h('div', { class: 'cell ' + tile }))
    }),
  )
  lastMap = game.map
  lastTiles = h('div', { class: 'tiles', 'aria-hidden': 'true' }, cells)
  return lastTiles
}

// Moved with transform only (--cell is the tile size from style.css)
function playerView(p, me) {
  return h('div', {
    key: p.id,
    class: `player p${p.id}${p.safe ? ' safe' : ''}${p.name === me ? ' me' : ''}`,
    style: { transform: `translate(calc(${p.x} * var(--cell)), calc(${p.y} * var(--cell)))` },
  }, initial(p.name))
}

// One chip per player above the board: name, lives and power-ups
function chipView(p, me) {
  const alive = p.lives > 0
  const info = `${p.lives} lives, ${p.bombs} bombs, range ${p.range}, speed ${p.speed}`
  return h('li', { key: p.id, class: alive ? 'chip' : 'chip out' },
    h('span', { class: 'avatar p' + p.id }, initial(p.name)),
    h('span', { class: 'chip-text' },
      h('b', {}, p.name === me ? p.name + ' (you)' : p.name),
      alive
        ? h('span', { class: 'stats', role: 'img', 'aria-label': info, title: info },
            h('span', {}, '❤️ ' + p.lives),
            h('span', {}, '💣 ' + p.bombs),
            h('span', {}, '🔥 ' + p.range),
            h('span', {}, '⚡ ' + p.speed),
          )
        : h('span', { class: 'stats' }, 'Out'),
    ),
  )
}

function overView(s) {
  let title = 'Nobody Survived'
  if (s.winner === s.me) title = 'You Win!'
  else if (s.winner) title = s.winner + ' Wins!'
  return h('div', { class: 'overlay' },
    h('div', { class: 'alert', role: 'alert' },
      h('h2', {}, title),
      h('p', {}, 'Back to the waiting room in 5 s…'),
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
    h('div', { class: 'game-header' },
      h('h2', {}, 'Bomberman'),
      me && me.lives === 0 && h('span', { class: 'badge' }, "You're out. Watching…"),
      h('span', { class: 'fps', title: 'Frames per second' }, s.fps + ' FPS'),
    ),
    h('ul', { class: 'chips' }, game.players.map((p) => chipView(p, s.me))),
    h('div', { class: 'board' },
      tilesView(game),
      h('div', { class: 'players', 'aria-hidden': 'true' }, game.players.filter((p) => p.lives > 0).map((p) => playerView(p, s.me))),
      s.over && overView(s),
    ),
    hint,
  )
}
