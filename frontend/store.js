import { createStore } from './framework/index.js'

export const store = createStore({
  screen: 'login', // 'login' | 'lobby'
  connected: false,
  name: '', // nickname input
  me: '', // nickname accepted by the server
  error: '',
})
