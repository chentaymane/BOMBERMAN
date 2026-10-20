import { h, mount } from './framework/index.js'
import { store } from './store.js'
import { connect } from './socket.js'
import { loginView } from './login.js'
import { lobbyView } from './lobby.js'
import { chatView } from './chat.js'
import { gameView } from './game.js'

let chatId = 0
let nextGame = null // newest game state, drawn on the next frame

function onMessage(msg) {
  switch (msg.type) {
    case 'joined':
      return store.setState({ screen: 'lobby', me: msg.name, error: '' })
    case 'error':
      return store.setState({ error: msg.message })
    case 'lobby':
      nextGame = null
      return store.setState({ screen: 'lobby', lobby: msg, game: null })
    case 'state':
      nextGame = msg
      return
    case 'chat':
      return store.setState((s) => ({
        messages: [{ id: ++chatId, from: msg.from, text: msg.text }, ...s.messages].slice(0, 50),
      }))
  }
}

connect(
  onMessage,
  () => store.setState({ connected: true }),
  () => store.setState({ connected: false, screen: 'login', error: 'No connection to the server. Start the backend and refresh.' }),
)

function view(s) {
  if (s.screen === 'login') return loginView(s)
  return h('div', { class: 'layout' }, s.screen === 'game' ? gameView(s) : lobbyView(s), chatView(s))
}

mount(view, document.getElementById('app'), store)

// Game loop: the newest state from the server is drawn once per frame
function loop() {
  if (nextGame) {
    store.setState({ screen: 'game', game: nextGame })
    nextGame = null
  }
  requestAnimationFrame(loop)
}

requestAnimationFrame(loop)
