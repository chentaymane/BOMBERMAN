import { h } from './framework/index.js'
import { store } from './store.js'
import { send } from './socket.js'

function join(e) {
  e.preventDefault()
  const name = store.getState().name.trim()
  if (name) send({ type: 'join', name })
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
    h('button', { type: 'submit', disabled: !s.connected }, s.connected ? 'Join Game' : 'Connecting…'),
    s.error && h('p', { class: 'error', role: 'alert' }, s.error),
  )
}
