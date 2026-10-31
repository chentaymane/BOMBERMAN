import { createJsonSocket } from './lib/websocket.js'
import { store } from './store.js'
import { playDeathSounds, playIntroSound, playWinSound } from './game/media.js'

const MAX_CHAT_MESSAGES = 50
let nextChatId = 0

// The store combines incoming changes; the animation loop renders only once
// per frame even when several messages arrive together.
export function handleServerMessage(message) {
  if (!message || typeof message.type !== 'string') return
  switch (message.type) {
    case 'joined': {
      store.setState(state => ({
        screen: state.screen === 'login' ? 'lobby' : state.screen,
        me: message.name,
        error: '',
      }))
      playIntroSound(message)
      break
    }
    case 'error':
      store.setState({ error: message.message })
      break
    case 'lobby':
      store.setState({
        screen: 'lobby', lobby: message, game: null,
        over: false, winner: null, error: '',
      })
      break
    case 'state':
      playDeathSounds(store.getState().game, message)
      store.setState({ screen: 'game', game: message })
      break
    case 'chat':
      store.setState(state => ({
        messages: [
          { id: ++nextChatId, from: message.from, text: message.text },
          ...state.messages,
        ].slice(0, MAX_CHAT_MESSAGES),
      }))
      break
    case 'over':
      if (!store.getState().over) {
        const state = store.getState()
        playWinSound(state.game ?? state.lobby, message.winner)
      }
      store.setState({ over: true, winner: message.winner })
      break
  }
}

function handleDisconnect() {
  // Drop everything that belongs to the closed session. The nickname is kept so
  // the player can retry without typing it again.
  store.setState({
    connected: false,
    screen: 'login',
    me: '',
    game: null,
    over: false,
    winner: null,
    lobby: {
      players: [], taken: [],
      maxPlayers: 4, waitDuration: 20, readyDuration: 10,
      waitSeconds: null, countdown: null,
    },
    messages: [],
    draft: '',
    error: "Connection lost. Retry, or start the backend and retry again.",
  })
}

const socket = createJsonSocket()

export const send = socket.send

export function connect() {
  return socket.connect({
    onMessage: handleServerMessage,
    onOpen: () => store.setState({ connected: true, error: '' }),
    onClose: handleDisconnect,
  })
}
