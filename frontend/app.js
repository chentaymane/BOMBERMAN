import { h, mount } from './framework/index.js'
import { store } from './store.js'
import { connect } from './socket.js'
import { startControls, repeatMove } from './game/controls.js'
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

let frames = 0
let fpsStartedAt = performance.now()

// requestAnimationFrame stops in a hidden tab; restart the sample window so the
// first visible frame does not report an artificially low FPS.
document.addEventListener('visibilitychange', () => {
  frames = 0
  fpsStartedAt = performance.now()
})

function frame(now) {
  repeatMove(now)
  frames++

  if (now - fpsStartedAt >= 1000) {
    store.setState({ fps: Math.round(frames * 1000 / (now - fpsStartedAt)) })
    frames = 0
    fpsStartedAt = now
  }

  store.flush()
  requestAnimationFrame(frame)
}

requestAnimationFrame(frame)
