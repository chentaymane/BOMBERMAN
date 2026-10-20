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

// Like Messages: my bubbles on the right in blue, the others on the left with their name.
// Messages are stored newest first and shown with column-reverse,
// so the list always stays scrolled to the newest message.
// Text is only added as text nodes, never as HTML.
function messageView(m, me) {
  const mine = m.from === me
  return h('li', { key: m.id, class: mine ? 'message mine' : 'message' },
    !mine && h('span', { class: 'from' }, m.from),
    h('span', { class: 'bubble' }, m.text),
  )
}

export function chatView(s) {
  return h('section', { class: 'chat', 'aria-label': 'Chat' },
    h('h2', {}, 'Chat'),
    s.messages.length
      ? h('ul', { class: 'messages', 'aria-live': 'polite' }, s.messages.map((m) => messageView(m, s.me)))
      : h('p', { class: 'messages empty secondary' }, 'No messages yet. Say hi to the other players!'),
    h('form', { class: 'composer', onSubmit: sendChat },
      h('input', {
        'aria-label': 'Message',
        placeholder: 'Message',
        maxlength: 200,
        value: s.draft,
        onInput: (e) => store.setState({ draft: e.target.value }),
      }),
      h('button', { type: 'submit', disabled: !s.draft.trim() }, 'Send'),
    ),
  )
}
