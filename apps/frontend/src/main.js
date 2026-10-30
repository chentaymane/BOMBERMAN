import { h, mount } from 'mini-fw'
import { store } from './store.js'
import { connect } from './network/socket.js'
import { startControls, repeatMove } from './game/controls.js'
import { loginView } from './views/login.js'
import { lobbyView } from './views/lobby.js'
import { gameView } from './views/game.js'
import { chatView } from './views/chat.js'
import { loadCharacters, startSounds } from './game/media.js'

function appView(state) {
  if (state.screen === 'login') return loginView(state)

  const screen = state.screen === 'game' ? gameView(state) : lobbyView(state)
  return h('div', { class: 'layout' }, screen, chatView(state))
}

mount(appView, document.getElementById('app'), store)
startControls()
startSounds()
connect()
loadCharacters()

let frames = 0
let fpsStartedAt = performance.now()

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
