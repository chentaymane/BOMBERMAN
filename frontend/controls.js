import { on } from './framework/index.js'
import { store } from './store.js'
import { send } from './socket.js'

const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', ' ': 'bomb' }
const REPEAT = 50 // ms between two moves while a key is held (server keeps only the last one)

let held = null // direction of the arrow key held down
let lastSent = 0

on(document, 'keydown', (e) => {
  const move = KEYS[e.key]
  if (!move || e.target.tagName === 'INPUT' || store.getState().screen !== 'game') return
  e.preventDefault() // no page scroll
  if (e.repeat) return // the game loop repeats moves itself
  send({ type: 'move', move })
  if (move !== 'bomb') {
    held = move
    lastSent = performance.now()
  }
})

on(document, 'keyup', (e) => {
  if (KEYS[e.key] === held) held = null
})

on(window, 'blur', () => (held = null))

// Called every frame by the game loop: keep moving while the key is held
export function repeatMove(now) {
  if (held && now - lastSent >= REPEAT) {
    send({ type: 'move', move: held })
    lastSent = now
  }
}
