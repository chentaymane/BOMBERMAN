import { h } from './framework/index.js'
import { store } from './store.js'
import { send } from './socket.js'

// One name per picture: characters/1.webp .. characters/6.webp
const CHARACTERS = ['Glasses', 'Red cap', 'Grey tracksuit', 'Black tracksuit', 'Sunglasses', 'Fighter']

// My character, from the last lobby message (the server is the source of truth)
function myCharacter(players, me) {
  const mine = players.find((p) => p.name === me)
  return mine ? mine.character : null
}

// Pick a character: locked ones are disabled, mine is marked as picked.
// A pick that just became impossible is refused by the server with an error.
function pickerView(s) {
  const { players } = s.lobby
  const me = myCharacter(players, s.me)
  const free = players.map((p) => p.character)

  return h('div', { class: 'field' },
    h('span', { class: 'field-label' }, 'Your character'),
    h('div', { class: 'picker', role: 'radiogroup', 'aria-label': 'Character' },
      CHARACTERS.map((label, i) => {
        const value = i + 1
        const picked = me === value
        const locked = !picked && free.includes(value)
        return h('button', {
          type: 'button',
          class: `pick c${value}${picked ? ' picked' : ''}${locked ? ' locked' : ''}`,
          role: 'radio',
          'aria-checked': picked ? 'true' : 'false',
          'aria-label': locked ? label + ' (taken)' : label,
          title: locked ? label + ' — taken' : label,
          disabled: locked,
          onClick: () => send({ type: 'pick', character: value }),
        })
      }),
    ),
  )
}

// One slot per player, with the character they picked
function slotView(player, me) {
  if (!player) return h('li', { class: 'slot empty' }, h('span', { class: 'avatar' }), 'Open')
  return h('li', { class: 'slot' },
    h('span', { class: 'avatar c' + player.character }),
    h('span', { class: 'slot-name' }, player.name === me ? player.name + ' (you)' : player.name),
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
    h('ul', { class: 'slots' }, [0, 1, 2, 3].map((i) => slotView(players[i], s.me))),
    h('p', {}, status),
    left != null && h('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': total, 'aria-valuenow': left },
      h('div', { class: 'progress-bar', style: { transform: `scaleX(${left / total})` } }),
    ),
    pickerView(s),
    s.error && h('p', { class: 'error', role: 'alert' }, s.error),
  )
}
