import { on } from './framework/index.js'
import { store } from './store.js'
import { send } from './socket.js'

const KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', ' ': 'bomb' }
const MOVE_DELAY = 200 // ms between two moves, same as MOVE_DELAY in backend/game.js
const SPEED_STEP = 30 // each speed power up removes this from the wait, same as SPEED_STEP

let lastMoveAt = -Infinity // performance.now() of the last move sent

// My speed power-up level (0 to 4), the debounce shrinks with it
function mySpeed() {
  const s = store.getState()
  const me = s.game && s.game.players.find((p) => p.name === s.me)
  return me ? me.speed : 0
}

// One move per key press: held keys are not repeated, and a second press is
// ignored until the debounce is over (200 ms, less with speed power-ups).
on(document, 'keydown', (e) => {
  if (e.key === 'Escape' && e.target.tagName === 'INPUT') return e.target.blur() // back to the game
  const move = KEYS[e.key]
  if (!move || e.target.tagName === 'INPUT' || store.getState().screen !== 'game') return
  e.preventDefault() // no page scroll
  if (e.repeat) return // one move per physical press, holding does nothing
  const now = performance.now()
  if (move !== 'bomb') {
    if (now - lastMoveAt < MOVE_DELAY - mySpeed() * SPEED_STEP) return // too fast, debounce
    lastMoveAt = now
  }
  send({ type: 'move', move })
})
