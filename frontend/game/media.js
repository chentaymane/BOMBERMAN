import { playSound, muteSounds } from '../lib/sound.js'
import { CHARACTERS } from '../data/characters.js'
import { store } from '../store.js'

export function toggleSound() {
  const soundEnabled = !store.getState().soundEnabled
  muteSounds(!soundEnabled)
  store.setState({ soundEnabled })
}

// Every time my character is assigned or picked. A new pick cuts the old intro.
export function playIntro(id) {
  const character = CHARACTERS[id - 1]
  if (character) playSound(character.intro, 'intro')
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
