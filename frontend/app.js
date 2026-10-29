import { h, mount } from './framework/index.js'
import { store } from './state/store.js'
import { connect } from './network/socket.js'
import { handleServerMessage, handleDisconnect } from './network/messages.js'
import { startControls } from './game/controls.js'
import { startLoop } from './game/loop.js'
import { loginView } from './screens/login.js'
import { lobbyView } from './screens/lobby.js'
import { gameView } from './screens/game.js'
import { chatView } from './components/chat.js'
import { loadCharacters } from './game/preload-characters.js'
import { startSounds } from './game/sounds.js'

function appView(state) {
  if (state.screen === 'login') return loginView(state)

  const screen = state.screen === 'game' ? gameView(state) : lobbyView(state)
  return h('div', { class: 'layout' }, screen, chatView(state))
}

mount(appView, document.getElementById('app'), store)
startControls()
startSounds()
connect({
  onMessage: handleServerMessage,
  onOpen: () => store.setState({ connected: true }),
  onClose: handleDisconnect,
})
startLoop()
loadCharacters()
