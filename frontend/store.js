import { createStore } from './framework/index.js'

export const store = createStore({
  screen: 'login', // 'login' | 'lobby' | 'game'
  connected: false,
  name: '', // nickname input
  me: '', // nickname accepted by the server
  error: '',
  lobby: { players: [], waitSeconds: null, countdown: null },
  game: null, // last 'state' message from the server
  messages: [], // chat, newest first
  draft: '', // chat input
})
