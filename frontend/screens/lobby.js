import { h } from '../framework/index.js'
import { send } from '../network/socket.js'
import { CHARACTERS } from '../data/characters.js'
import { characterStyle, avatarView } from '../components/character.js'

// My character, from the last lobby message (the server is the source of truth)
function findMyCharacter(players, me) {
  const mine = players.find((player) => player.name === me)
  return mine ? mine.character : null
}

// Pick a character: locked ones are disabled, mine is marked as picked.
// A pick that just became impossible is refused by the server with an error.
function pickerView(state) {
  const { players } = state.lobby
  const me = findMyCharacter(players, state.me)
  const takenCharacters = players.map((player) => player.character)

  return h('div', { class: 'field' },
    h('span', { class: 'field-label' }, 'Your character'),
    h('div', { class: 'picker', role: 'radiogroup', 'aria-label': 'Character' },
      CHARACTERS.map((label, i) => {
        const value = i + 1
        const picked = me === value
        const locked = !picked && takenCharacters.includes(value)
        return h('button', {
          type: 'button',
          class: `pick c${value}${picked ? ' picked' : ''}${locked ? ' locked' : ''}`,
          style: characterStyle(value),
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
    avatarView(player.character),
    h('span', { class: 'slot-name' }, player.name === me ? player.name + ' (you)' : player.name),
  )
}

export function lobbyView(state) {
  const { players, waitSeconds, countdown, maxPlayers, waitDuration, readyDuration } = state.lobby

  let status = 'Waiting for at least one more player…'
  let left = null // seconds left on the running timer
  let total = 0
  if (countdown != null) {
    status = `Get ready! The game starts in ${countdown} s`
    left = countdown
    total = readyDuration
  } else if (waitSeconds != null) {
    status = `More players can join for ${waitSeconds} s`
    left = waitSeconds
    total = waitDuration
  }

  return h('div', { class: 'card' },
    h('h1', {}, 'Waiting Room'),
    h('p', { class: 'secondary' }, `${players.length} of ${maxPlayers ?? '…'} players`),
    h('ul', { class: 'slots' },
      Array.from({ length: maxPlayers ?? 0 }, (_, i) => slotView(players[i], state.me)),
    ),
    h('p', {}, status),
    left != null && h('div', {
      class: 'progress', role: 'progressbar',
      'aria-valuemin': 0, 'aria-valuemax': total, 'aria-valuenow': left,
    },
      h('div', { class: 'progress-bar', style: { transform: `scaleX(${left / total})` } }),
    ),
    pickerView(state),
    state.error && h('p', { class: 'error', role: 'alert' }, state.error),
  )
}
