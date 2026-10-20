import { h, mount } from './framework/index.js'
import { store } from './store.js'
import { connect } from './socket.js'
import { loginView } from './login.js'
import { lobbyView } from './lobby.js'

function onMessage(msg) {
  switch (msg.type) {
    case 'joined':
      return store.setState({ screen: 'lobby', me: msg.name, error: '' })
    case 'error':
      return store.setState({ error: msg.message })
    case 'lobby':
      return store.setState({ screen: 'lobby', lobby: msg })
  }
}

connect(
  onMessage,
  () => store.setState({ connected: true }),
  () => store.setState({ connected: false, screen: 'login', error: 'No connection to the server. Start the backend and refresh.' }),
)

function view(s) {
  if (s.screen === 'login') return loginView(s)
  return lobbyView(s)
}

mount(view, document.getElementById('app'), store)
