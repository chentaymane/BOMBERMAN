import { on } from '../framework/index.js'
import { store } from '../store.js'
import { send } from '../socket.js'

const KEY_MOVES = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
}
const INPUT_REPEAT_MS = 50

// Last pressed direction takes priority when several arrow keys are held.
let heldMoves = []
let lastSentAt = 0

function clearHeldMoves() {
  heldMoves = []
}

function isTyping(element) {
  return element?.tagName === 'INPUT' || element?.tagName === 'TEXTAREA'
}

function handleKeyDown(event) {
  if (event.key === 'Escape' && isTyping(event.target)) {
    event.target.blur()
    return
  }

  const move = KEY_MOVES[event.key]
  const placing = event.key === ' '
  if ((!move && !placing) || isTyping(event.target) || store.getState().screen !== 'game') return
  event.preventDefault()
  if (event.repeat) return

  if (placing) {
    send({ type: 'place' })
    return
  }

  send({ type: 'move', move })
  heldMoves = heldMoves.filter(held => held !== move).concat(move)
  lastSentAt = performance.now()
}

export function startControls() {
  const unsubscribe = [
    on(document, 'keydown', handleKeyDown),
    on(document, 'keyup', event => {
      heldMoves = heldMoves.filter(move => move !== KEY_MOVES[event.key])
    }),
    on(document, 'focusin', event => {
      if (isTyping(event.target)) clearHeldMoves()
    }),
    on(window, 'blur', clearHeldMoves),
  ]

  return () => {
    unsubscribe.forEach(stop => stop())
    clearHeldMoves()
  }
}

export function repeatMove(now) {
  if (store.getState().screen !== 'game' || isTyping(document.activeElement)) {
    clearHeldMoves()
    return
  }

  const move = heldMoves.at(-1)
  if (!move || now - lastSentAt < INPUT_REPEAT_MS) return
  send({ type: 'move', move })
  lastSentAt = now
}
