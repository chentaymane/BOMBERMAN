import { on } from '../framework/index.js'
import { createAudioPlayer } from '../lib/audio.js'
import { CHARACTERS } from '../data/characters.js'
import { preloadImages } from '../lib/images.js'
import { store } from '../store.js'

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
  if (!previousGame?.players || !nextGame?.players) return
  for (const player of nextGame.players) {
    const previous = previousGame.players.find(other => other.id === player.id)
    const sound = CHARACTERS[player.character - 1]?.deathSound
    if (previous && player.lives < previous.lives && !player.forfeited && sound) play(sound)
  }
}

export function playWinSound(game, winner, play = sound => audio.play(sound)) {
  const player = game?.players?.find(player => player.name === winner)
  const sound = player && CHARACTERS[player.character - 1]?.winSound
  if (sound) play(sound)
}

// Play once per local character assignment in this page session. Reserve before
// awaiting playback to prevent duplicate messages from starting the same intro.
// Failed or muted playback remains retryable on a later assignment.
const introducedCharacters = new Set()

export async function playIntroSound(player, play = sound => audio.play(sound)) {
  const character = player?.character
  const sound = CHARACTERS[character - 1]?.introSound
  if (!sound || introducedCharacters.has(character)) return false
  introducedCharacters.add(character)
  const started = await play(sound)
  if (!started) introducedCharacters.delete(character)
  return Boolean(started)
}

// Decode character images before allowing entry to the lobby.
// Keeping the decoded images alive also avoids discarding them before that render.
let images = []

export async function loadCharacters() {
  store.setState({ charactersStatus: 'loading' })
  try {
    images = await preloadImages(CHARACTERS.map(character => character.image))
    store.setState({ charactersStatus: 'ready' })
  } catch {
    store.setState({ charactersStatus: 'error' })
  }
}
