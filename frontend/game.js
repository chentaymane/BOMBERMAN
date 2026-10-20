import { h } from './framework/index.js'

const CELL = 40 // px, same as --cell in style.css
const TILES = { '#': 'wall', B: 'block', X: 'bomb', F: 'fire', b: 'power-bomb', f: 'power-flame', s: 'power-speed' }

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
  lastTiles = h('div', { class: 'tiles' }, cells)
  return lastTiles
}

function playerView(p, me) {
  return h('div', {
    key: p.id,
    class: `player p${p.id}${p.safe ? ' safe' : ''}${p.name === me ? ' me' : ''}`,
    style: { transform: `translate(${p.x * CELL}px, ${p.y * CELL}px)` },
  }, p.name.charAt(0).toUpperCase())
}

function hudView(game, me) {
  return h('ul', { class: 'hud' }, game.players.map((p) =>
    h('li', { key: p.id, class: p.lives > 0 ? null : 'dead' },
      h('span', { class: 'dot p' + p.id }),
      h('b', {}, p.name === me ? p.name + ' (you)' : p.name),
      h('span', {}, `❤ ${p.lives}  💣 ${p.bombs}  🔥 ${p.range}  ⚡ ${p.speed}`),
    ),
  ))
}

export function gameView(s) {
  const game = s.game
  return h('div', { class: 'game' },
    h('div', { class: 'board' },
      tilesView(game),
      h('div', { class: 'players' }, game.players.filter((p) => p.lives > 0).map((p) => playerView(p, s.me))),
    ),
    hudView(game, s.me),
  )
}
