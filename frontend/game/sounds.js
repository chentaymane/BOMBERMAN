import { on } from '../framework/index.js'
import { createAudioPlayer } from '../framework/audio.js'
import { DEATH_SOUNDS } from '../data/characters.js'
import { store } from '../state/store.js'

const audio = createAudioPlayer()

export function startSounds() {
  const unlock = () => { audio.unlock() }
  const stopPointer = on(document, 'pointerdown', unlock)
  const stopKeyboard = on(document, 'keydown', unlock)
  return () => {
    stopPointer()
    stopKeyboard()
  }
}

export function toggleSound() {
  const soundEnabled = !store.getState().soundEnabled
  audio.setEnabled(soundEnabled)
  store.setState({ soundEnabled })
}

// Compare consecutive network snapshots, not renders: several snapshots may
// arrive within one animation frame. Initial state and forfeits are silent.
export function playDeathSounds(previousGame, nextGame, play = sound => audio.play(sound)) {
  if (!previousGame) return
  for (const player of nextGame.players) {
    const previous = previousGame.players.find(other => other.id === player.id)
    const sound = DEATH_SOUNDS[player.character]
    if (previous && player.lives < previous.lives && !player.forfeited && sound) play(sound)
  }
}
