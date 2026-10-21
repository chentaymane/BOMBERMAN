import { createStore } from './framework/index.js'

export const store = createStore({
  screen: 'login', // 'login' | 'lobby' | 'game'
  connected: false,
  name: '', // nickname input
  me: '', // nickname accepted by the server
  myCharacter: null, // character the server assigned me (1 to 6)
  error: '',
  lobby: { players: [], taken: [], waitSeconds: null, countdown: null },
  game: null, // last 'state' message from the server
  over: false, // game finished
  winner: null, // winner name, null if nobody survived
  fps: 0,
  messages: [], // chat, newest first
  draft: '', // chat input
})
