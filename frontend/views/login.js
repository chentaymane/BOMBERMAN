import { h } from '../framework/index.js'
import { store } from '../store.js'
import { connect, send } from '../socket.js'
import { loadCharacters } from '../game/media.js'

function join(event) {
  event.preventDefault()
  const { name, connected, charactersStatus } = store.getState()
  if (!connected || charactersStatus !== 'ready') return
  if (!name.trim()) return store.setState({ error: 'Enter a nickname' })
  // No character: the waiting room picks a random free one right away
  send({ type: 'join', name: name.trim() })
}

function retryConnection() {
  store.setState({ error: '' })
  connect()
}

export function loginView(state) {
  const ready = state.charactersStatus === 'ready'
  let buttonLabel = 'Join Game'
  if (!state.connected) buttonLabel = state.error ? 'Server offline' : 'Connecting…'
  else if (state.charactersStatus === 'loading') buttonLabel = 'Loading characters…'

  return h('form', { class: 'card', onSubmit: join },
    h('div', { class: 'logo', 'aria-hidden': 'true' }),
    h('h1', { class: 'title' }, 'Bomberman'),
    h('p', { class: 'secondary' }, '2 to 4 players. The last one standing wins.'),
    h('label', { class: 'field' },
      h('span', { class: 'field-label' }, 'Nickname'),
      h('input', {
        placeholder: '1–15 letters, numbers, spaces, _ or -',
        maxlength: 15,
        value: state.name,
        autofocus: true,
        autocomplete: 'off',
        spellcheck: 'false',
        onInput: (event) => store.setState({ name: event.target.value, error: '' }),
      }),
    ),
    h('p', { class: 'secondary' }, 'You will get a random character, change it in the waiting room.'),
    h('button', { type: 'submit', disabled: !state.connected || !ready }, buttonLabel),
    !state.connected && state.error && h('button', {
      type: 'button', class: 'secondary-button', onClick: retryConnection,
    }, 'Retry connection'),
    state.charactersStatus === 'error' && h('div', { class: 'field', role: 'alert' },
      h('p', { class: 'error' }, "Couldn't load the characters. Check your connection and retry."),
      h('button', { type: 'button', onClick: loadCharacters }, 'Retry loading characters'),
    ),
    state.error && h('p', { class: 'error', role: 'alert' }, state.error),
  )
}
