import { playSound, muteSounds } from '../lib/sound.js'
import { CHARACTERS } from '../data/characters.js'
import { store } from '../store.js'

const character = id => CHARACTERS[id - 1]

export function toggleSound() {
  const soundEnabled = !store.getState().soundEnabled
  muteSounds(!soundEnabled)
  store.setState({ soundEnabled })
}

// Every time my character is assigned or picked. A new pick cuts the old intro.
export function playIntro(id) {
  if (character(id)) playSound(character(id).sounds.intro, 'intro')
}

// Compare two server snapshots: lost a life -> damage.mp3, lost the last one -> kill.mp3.
// Forfeits (player left) stay silent.
export function playHitSounds(previousGame, nextGame) {
  if (!previousGame?.players || !nextGame?.players) return
  for (const player of nextGame.players) {
    const before = previousGame.players.find(other => other.id === player.id)
    if (!before || player.lives >= before.lives || player.forfeited || !character(player.character)) continue
    const { sounds } = character(player.character)
    playSound(player.lives === 0 ? sounds.kill : sounds.damage)
  }
}

export function playWinSound(game, winner) {
  const player = game?.players?.find(player => player.name === winner)
  if (player && character(player.character)) playSound(character(player.character).sounds.win)
}

// Decode every character image before allowing entry to the lobby.
// Kept in a variable so the browser does not drop the decoded images.
let images = []

export async function loadCharacters() {
  store.setState({ charactersStatus: 'loading' })
  try {
    images = CHARACTERS.map(({ image }) => Object.assign(new Image(), { src: image }))
    await Promise.all(images.map(image => image.decode()))
    store.setState({ charactersStatus: 'ready' })
  } catch {
    store.setState({ charactersStatus: 'error' })
  }
}
