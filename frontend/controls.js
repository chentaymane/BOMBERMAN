import { on } from './framework/index.js'
import { store } from './store.js'
import { send } from './socket.js'

const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', ' ': 'bomb' }
const REPEAT = 50 // ms between two move messages while an arrow key is held

let pressed = [] // arrow keys held down, in press order: the last one pressed wins
let lastSent = 0

on(document, 'keydown', (e) => {
  if (e.key === 'Escape' && e.target.tagName === 'INPUT') return e.target.blur() // back to the game
  const move = KEYS[e.key]
  if (!move || e.target.tagName === 'INPUT' || store.getState().screen !== 'game') return
  e.preventDefault() // no page scroll
  if (e.repeat) return // held keys are repeated by the game loop, not by the keyboard
  send({ type: 'move', move })
  if (move !== 'bomb') {
    pressed = pressed.filter((m) => m !== move).concat(move)
    lastSent = performance.now()
  }
})

// Releasing a key: keep going with the arrow that is still held, if any
on(document, 'keyup', (e) => {
  pressed = pressed.filter((m) => m !== KEYS[e.key])
})

on(window, 'blur', () => (pressed = [])) // keys can be released while the window is not focused

// Called every frame by the game loop: keep moving while an arrow key is held.
// The server keeps the last wish and plays it as soon as the player may move again
// (200 ms, 30 ms less per speed power-up), so holding a key is one smooth walk.
export function repeatMove(now) {
  const move = pressed[pressed.length - 1]
  if (move && now - lastSent >= REPEAT) {
    send({ type: 'move', move })
    lastSent = now
  }
}
