import { h } from './framework/index.js'
import { store } from './store.js'
import { send } from './socket.js'

function sendChat(e) {
  e.preventDefault()
  const text = store.getState().draft.trim()
  if (!text) return
  send({ type: 'chat', text })
  store.setState({ draft: '' })
}

// Messages are stored newest first and shown with column-reverse,
// so the list always stays scrolled to the newest message.
// Text is only added as text nodes, never as HTML.
export function chatView(s) {
  return h('div', { class: 'chat' },
    h('h2', {}, 'Chat'),
    h('ul', { class: 'messages' }, s.messages.map((m) => h('li', { key: m.id }, h('b', {}, m.from + ': '), m.text))),
    h('form', { onSubmit: sendChat },
      h('input', {
        placeholder: 'Say something...',
        maxlength: 200,
        value: s.draft,
        onInput: (e) => store.setState({ draft: e.target.value }),
      }),
      h('button', { type: 'submit' }, 'Send'),
    ),
  )
}
