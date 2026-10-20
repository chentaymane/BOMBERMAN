import { h } from './framework/index.js'

// One slot per player. The color matches the player's color in the game.
function slotView(name, i, me) {
  if (!name) return h('li', { class: 'slot empty' }, h('span', { class: 'avatar' }), 'Open')
  return h('li', { class: 'slot' },
    h('span', { class: 'avatar p' + (i + 1) }, name.charAt(0).toUpperCase()),
    h('span', { class: 'slot-name' }, name === me ? name + ' (you)' : name),
  )
}

export function lobbyView(s) {
  const { players, waitSeconds, countdown } = s.lobby

  let status = 'Waiting for at least one more player…'
  let left = null // seconds left on the running timer
  let total = 0
  if (countdown != null) {
    status = `Get ready! The game starts in ${countdown} s`
    left = countdown
    total = 10
  } else if (waitSeconds != null) {
    status = `More players can join for ${waitSeconds} s`
    left = waitSeconds
    total = 20
  }

  return h('div', { class: 'card' },
    h('h1', {}, 'Waiting Room'),
    h('p', { class: 'secondary' }, `${players.length} of 4 players`),
    h('ul', { class: 'slots' }, [0, 1, 2, 3].map((i) => slotView(players[i], i, s.me))),
    h('p', {}, status),
    left != null && h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': total, 'aria-valuenow': left },
      h('div', { class: 'progress-bar', style: { transform: `scaleX(${left / total})` } }),
    ),
  )
}
