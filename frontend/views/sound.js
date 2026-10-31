import { h } from '../framework/index.js'
import { toggleSound } from '../game/media.js'

// Same mute button on every page that plays sounds (waiting room and game).
export function soundButton(state) {
  return h('button', {
    type: 'button', class: 'sound-toggle', onClick: toggleSound,
    'aria-label': 'Game sound', 'aria-pressed': state.soundEnabled ? 'true' : 'false',
  }, state.soundEnabled ? 'Sound: on' : 'Sound: off')
}
