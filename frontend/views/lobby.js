import { h } from '../framework/index.js'
import { send } from '../socket.js'
import { CHARACTERS } from '../data/characters.js'
import { soundButton } from './sound.js'

// Pick a character: locked ones are disabled, mine is marked as picked.
// A pick that just became impossible is refused by the server with an error.
function pickerView(state) {
  const { players } = state.lobby
  const me = players.find(player => player.name === state.me)?.character
  const takenCharacters = players.map((player) => player.character)

  return h('div', { class: 'field' },
    h('span', { class: 'field-label' }, 'Your character'),
    h('div', { class: 'picker', role: 'radiogroup', 'aria-label': 'Character' },
      CHARACTERS.map(({ id: value, name: label, style }) => {
        const picked = me === value
        const locked = !picked && takenCharacters.includes(value)
        return h('button', {
          type: 'button',
          class: `pick c${value}${picked ? ' picked' : ''}${locked ? ' locked' : ''}`,
          style,
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

export function lobbyView(state) {
  const { players, waitSeconds, countdown, maxPlayers, waitDuration, readyDuration } = state.lobby
  const slotCount = maxPlayers || players.length

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
      Array.from({ length: slotCount }, (_, i) => {
        const player = players[i]
        if (!player) return h('li', { class: 'slot empty' }, h('span', { class: 'avatar' }), 'Open')
        return h('li', { class: 'slot' },
          h('span', {
            class: 'avatar c' + player.character,
            style: CHARACTERS[player.character - 1]?.style ?? {},
          }),
          h('span', { class: 'slot-name' },
            player.name === state.me ? player.name + ' (you)' : player.name,
          ),
        )
      }),
    ),
    h('p', {}, status),
    left != null && h('div', {
      class: 'progress', role: 'progressbar',
      'aria-valuemin': 0, 'aria-valuemax': total, 'aria-valuenow': left,
    },
      h('div', { class: 'progress-bar', style: { transform: `scaleX(${left / (total || 1)})` } }),
    ),
    pickerView(state),
    soundButton(state),
    state.error && h('p', { class: 'error', role: 'alert' }, state.error),
  )
}
