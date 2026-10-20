import { h } from './framework/index.js'
import { store } from './store.js'
import { send } from './socket.js'

// One name per picture: characters/1.webp .. characters/6.webp
const CHARACTERS = ['Glasses', 'Red cap', 'Grey tracksuit', 'Black tracksuit', 'Sunglasses', 'Fighter']

function join(e) {
  e.preventDefault()
  const { name, character } = store.getState()
  if (!name.trim()) return store.setState({ error: 'Enter a nickname' })
  if (!character) return store.setState({ error: 'Pick a character' })
  send({ type: 'join', name: name.trim(), character })
}

function pickerView(s) {
  return h('div', { class: 'picker', role: 'radiogroup', 'aria-label': 'Character' },
    CHARACTERS.map((label, i) => {
      const picked = s.character === i + 1
      return h('button', {
        type: 'button',
        class: `pick c${i + 1}${picked ? ' picked' : ''}`,
        role: 'radio',
        'aria-checked': picked ? 'true' : 'false',
        'aria-label': label,
        title: label,
        onClick: () => store.setState({ character: i + 1, error: '' }),
      })
    }),
  )
}

export function loginView(s) {
  return h('form', { class: 'card', onSubmit: join },
    h('div', { class: 'logo', 'aria-hidden': 'true' }),
    h('h1', { class: 'title' }, 'Bomberman'),
    h('p', { class: 'secondary' }, '2 to 4 players. The last one standing wins.'),
    h('label', { class: 'field' },
      h('span', { class: 'field-label' }, 'Nickname'),
      h('input', {
        placeholder: 'Letters, numbers, _ or -',
        maxlength: 15,
        value: s.name,
        autofocus: true,
        onInput: (e) => store.setState({ name: e.target.value, error: '' }),
      }),
    ),
    h('div', { class: 'field' },
      h('span', { class: 'field-label' }, 'Character'),
      pickerView(s),
    ),
    h('button', { type: 'submit', disabled: !s.connected }, s.connected ? 'Join Game' : 'Connecting…'),
    s.error && h('p', { class: 'error', role: 'alert' }, s.error),
  )
}
