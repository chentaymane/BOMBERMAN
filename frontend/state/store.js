import { createBatchedStore } from '../framework/batched-state.js'

export const store = createBatchedStore({
  screen: 'login', // 'login' | 'lobby' | 'game'
  connected: false,
  charactersStatus: 'loading', // 'loading' | 'ready' | 'error'
  name: '', // nickname input
  me: '', // nickname accepted by the server
  myCharacter: null, // character the server assigned me (1 to 9)
  error: '',
  lobby: { players: [], taken: [], waitSeconds: null, countdown: null },
  game: null, // last 'state' message from the server
  over: false, // game finished
  winner: null, // winner name, null if nobody survived
  fps: 0,
  soundEnabled: true,
  messages: [], // chat, newest first
  draft: '', // chat input
})

export const flushStore = store.flush
