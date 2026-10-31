import { h, mount } from './framework/index.js'
import { store } from './store.js'
import { connect } from './socket.js'
import { startControls } from './game/controls.js'
import { loginView } from './views/login.js'
import { lobbyView } from './views/lobby.js'
import { gameView } from './views/game.js'
import { chatView } from './views/chat.js'
import { loadCharacters } from './game/media.js'

function appView(state) {
  if (state.screen === 'login') return loginView(state)
  const screen = state.screen === 'game' ? gameView(state) : lobbyView(state)
  return h('div', { class: 'layout' }, screen, chatView(state))
}

mount(appView, document.getElementById('app'), store)
startControls()
connect()
loadCharacters()

// One render per frame at most, however many messages arrived in between.
function frame() {
  store.flush()
  requestAnimationFrame(frame)
}
requestAnimationFrame(frame)
