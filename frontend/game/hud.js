import { h } from '../framework/index.js'
import { avatarView } from '../components/character.js'

// One card per player above the board: face, name, lives and power-ups
export function chipView(player, me) {
  const alive = player.lives > 0
  const info = `${player.bombs} bombs, range ${player.range}, speed ${player.speed}`
  let classes = 'chip'
  if (player.name === me) classes += ' me'
  if (!alive) classes += ' out'
  return h('li', { key: player.id, class: classes },
    avatarView(player.character),
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
export const controlsHint = h('p', { class: 'hint' },
  h('span', {}, h('kbd', {}, '← ↑ → ↓'), 'Move (hold to keep moving)'),
  h('span', {}, h('kbd', {}, 'Space'), 'Drop a bomb'),
  h('span', {}, h('kbd', {}, 'Esc'), 'Leave the chat'),
)

