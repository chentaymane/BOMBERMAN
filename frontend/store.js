import { createStore } from './framework/index.js'

export const initialState = {
  screen: 'login', // 'login' | 'lobby' | 'game'
  connected: false,
  charactersStatus: 'loading', // 'loading' | 'ready' | 'error'
  name: '', // nickname input
  me: '', // nickname accepted by the server
  error: '',
  lobby: {
    players: [], taken: [],
    maxPlayers: 4, waitDuration: 20, readyDuration: 10,
    waitSeconds: null, countdown: null,
  },
  game: null, // last 'state' message from the server
  over: false, // game finished
  winner: null, // winner name, null if nobody survived
  soundEnabled: true,
  messages: [], // chat, newest first
  draft: '', // chat input
}

// setState only stages changes; the animation loop calls flush() once per frame,
// so many socket messages in one frame cause a single render.
const committed = createStore(initialState)
let pending = initialState
let dirty = false

export const store = {
  getState: () => pending,
  setState(update) {
    pending = { ...pending, ...(typeof update === 'function' ? update(pending) : update) }
    dirty = true
  },
  flush() {
    if (!dirty) return
    dirty = false
    committed.setState(pending)
  },
  subscribe: committed.subscribe,
}
