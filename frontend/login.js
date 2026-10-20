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
    h('h1', {}, 'Bomberman'),
    h('input', {
      placeholder: 'Your nickname',
      maxlength: 15,
      value: s.name,
      autofocus: true,
      onInput: (e) => store.setState({ name: e.target.value, error: '' }),
    }),
    h('button', { type: 'submit', disabled: !s.connected }, s.connected ? 'Join' : 'Connecting...'),
    s.error && h('p', { class: 'error' }, s.error),
  )
}
