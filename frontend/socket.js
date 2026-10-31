import { createSocket } from './lib/socket.js'
import { store, initialState } from './store.js'
import { playIntro, playHitSounds, playWinSound } from './game/media.js'

const MAX_CHAT_MESSAGES = 50
let nextChatId = 0

// One handler per server message type (see backend/API.md)
const handlers = {
  // Sent on join and on every successful pick
  joined(message) {
    store.setState(state => ({
      screen: state.screen === 'login' ? 'lobby' : state.screen,
      me: message.name,
      error: '',
    }))
    playIntro(message.character)
  },

  error(message) {
    store.setState({ error: message.message })
  },

  lobby(message) {
    store.setState({ screen: 'lobby', lobby: message, game: null, over: false, winner: null, error: '' })
  },

  state(message) {
    playHitSounds(store.getState().game, message)
    store.setState({ screen: 'game', game: message })
  },

  chat(message) {
    store.setState(state => ({
      messages: [{ id: ++nextChatId, from: message.from, text: message.text }, ...state.messages]
        .slice(0, MAX_CHAT_MESSAGES),
    }))
  },

  over(message) {
    const state = store.getState()
    if (!state.over) playWinSound(state.game ?? state.lobby, message.winner)
    store.setState({ over: true, winner: message.winner })
  },
}

const socket = createSocket({
  onOpen: () => store.setState({ connected: true, error: '' }),
  onMessage: message => handlers[message?.type]?.(message),
  // Drop the closed session, but keep the nickname and settings for a retry.
  onClose: () => store.setState(state => ({
    ...initialState,
    name: state.name,
    charactersStatus: state.charactersStatus,
    soundEnabled: state.soundEnabled,
    error: 'Connection lost. Retry, or start the backend and retry again.',
  })),
})

export const connect = socket.connect
export const send = socket.send
