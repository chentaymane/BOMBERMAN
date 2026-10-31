import { createBatchedStore } from './lib/batched-state.js'

export const store = createBatchedStore({
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
  fps: 0,
  soundEnabled: true,
  messages: [], // chat, newest first
  draft: '', // chat input
})

