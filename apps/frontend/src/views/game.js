import { h } from 'mini-fw'
import { CHARACTERS } from '../data/characters.js'
import { tilesView } from '../game/tiles.js'
import { toggleSound } from '../game/media.js'

// Last drawn position of each player, to spot a respawn (a jump of more than one cell)
const lastPositions = {}

// The server sends the movement duration so animation and game rules agree.
function playerView(player, me) {
  const prev = lastPositions[player.id]
  const respawn = prev && Math.abs(prev.x - player.x) + Math.abs(prev.y - player.y) > 1
  lastPositions[player.id] = { x: player.x, y: player.y }
  return h('div', {
    key: player.id,
    class: `player c${player.character}${player.safe ? ' safe' : ''}${player.name === me ? ' me' : ''}`,
    style: {
      ...CHARACTERS[player.character - 1].style,
      transform: `translate(calc(${player.x} * var(--cell)), calc(${player.y} * var(--cell)))`,
      transitionDuration: respawn ? '0ms' : player.moveDelay + 'ms', // no slide back to the corner
    },
  }, h('span', { class: 'tag' }, player.name))
}

// One card per player above the board: face, name, lives and power-ups
function chipView(player, me) {
  const alive = player.lives > 0
  const info = `${player.bombs} bombs, range ${player.range}, speed ${player.speed}`
  let classes = 'chip'
  if (player.name === me) classes += ' me'
  if (!alive) classes += ' out'
  return h('li', { key: player.id, class: classes },
    h('span', {
      class: 'avatar c' + player.character, style: CHARACTERS[player.character - 1].style,
    }),
    h('span', { class: 'chip-text' },
      h('span', { class: 'chip-top' },
        h('b', {}, player.name === me ? player.name + ' (you)' : player.name),
        alive
          ? h('span', {
            class: 'hearts', role: 'img', 'aria-label': player.lives + ' lives',
          }, '❤️'.repeat(player.lives))
          : h('span', { class: 'hearts' }, player.forfeited ? 'Forfeit' : 'Out'),
      ),
      alive && h('span', { class: 'stats', role: 'img', 'aria-label': info, title: info },
        h('span', {}, '💣 ' + player.bombs),
        h('span', {}, '🔥 ' + player.range),
        h('span', {}, '⚡ ' + player.speed),
      ),
    ),
  )
}

// Never changes, so it is built once and the framework always skips it
const controlsHint = h('p', { class: 'hint' },
  h('span', {}, h('kbd', {}, '← ↑ → ↓'), 'Move (hold to keep moving)'),
  h('span', {}, h('kbd', {}, 'Space'), 'Drop a bomb'),
  h('span', {}, h('kbd', {}, 'Esc'), 'Leave the chat'),
)

function resultView(state, game) {
  const winner = game.players.find(player => player.name === state.winner)
  let title = 'Nobody Survived'
  if (state.winner === state.me) title = 'You Win!'
  else if (state.winner) title = state.winner + ' Wins!'
  return h('div', { class: 'overlay' },
    h('div', { class: 'result', role: 'alert' },
      winner && h('span', {
        class: 'avatar c' + winner.character, style: CHARACTERS[winner.character - 1].style,
      }),
      h('h2', {}, title),
      h('p', { class: 'secondary' }, 'Back to the waiting room in 5 s…'),
    ),
  )
}

export function gameView(state) {
  const game = state.game
  const me = game.players.find(player => player.name === state.me)
  const alive = game.players.filter(player => player.lives > 0)
  return h('div', {
    class: 'game',
    style: { '--columns': game.map[0].length, '--rows': game.map.length },
  },
    h('ul', { class: 'chips' }, game.players.map(player => chipView(player, state.me))),
    h('div', { class: 'board' },
      tilesView(game),
      h('div', { class: 'players', 'aria-hidden': 'true' },
        alive.map(player => playerView(player, state.me)),
      ),
      me && me.lives === 0 && !state.over
        && h('div', { class: 'banner' }, "You're out! Watching…"),
      state.over && resultView(state, game),
    ),
    h('div', { class: 'game-footer' },
      controlsHint,
      h('button', {
        type: 'button', class: 'sound-toggle', onClick: toggleSound,
        'aria-label': 'Game sound', 'aria-pressed': state.soundEnabled ? 'true' : 'false',
      }, state.soundEnabled ? 'Sound: on' : 'Sound: off'),
      h('span', { class: 'fps', title: 'Frames per second' }, state.fps + ' FPS'),
    ),
  )
}
