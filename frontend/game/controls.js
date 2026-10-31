import { on } from '../framework/index.js'
import { store } from '../store.js'
import { send } from '../socket.js'

const KEY_MOVES = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
}

// Arrow keys held right now, the last pressed one wins.
// The server moves one step per press and keeps walking while a key is held,
// so we only tell it when the wanted direction changes (never repeat ourselves).
let held = []

function update(next) {
  const before = held.at(-1) ?? null
  held = next
  const after = held.at(-1) ?? null
  if (after !== before) send({ type: 'move', move: after })
}

function releaseAll() {
  if (held.length) update([])
}

function isTyping(element) {
  return element?.tagName === 'INPUT' || element?.tagName === 'TEXTAREA' || element?.isContentEditable === true
}

// Space must keep activating a focused button instead of dropping a bomb.
function isButtonLike(element) {
  const tag = element?.tagName
  return tag === 'BUTTON' || tag === 'A' || tag === 'SELECT'
}

// No input while waiting, after the game ended, or while our player is out.
function canPlay() {
  const state = store.getState()
  if (state.screen !== 'game' || state.over || !state.game) return false
  const me = state.game.players.find(player => player.name === state.me)
  return !me || me.lives > 0
}

function handleKeyDown(event) {
  if (event.key === 'Escape' && isTyping(event.target)) return event.target.blur()
  // Leave browser shortcuts (tab switching, page navigation...) untouched.
  if (event.altKey || event.ctrlKey || event.metaKey) return

  const move = KEY_MOVES[event.key]
  const placing = event.key === ' '
  if ((!move && !placing) || isTyping(event.target) || !canPlay()) return
  if (placing && isButtonLike(event.target)) return
  event.preventDefault()
  if (event.repeat) return // the keyboard's own repeat is ignored

  if (placing) send({ type: 'place' })
  else update(held.filter(key => key !== move).concat(move))
}

function handleKeyUp(event) {
  const move = KEY_MOVES[event.key]
  if (move) update(held.filter(key => key !== move))
}

export function startControls() {
  on(document, 'keydown', handleKeyDown)
  on(document, 'keyup', handleKeyUp)
  on(document, 'focusin', event => { if (isTyping(event.target)) releaseAll() })
  on(window, 'blur', releaseAll)
}
