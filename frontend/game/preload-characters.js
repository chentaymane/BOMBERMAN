import { CHARACTER_IMAGES } from '../data/characters.js'
import { store } from '../state/store.js'
import { preloadImages } from '../framework/images.js'

// Decode character images before allowing entry to the lobby.
// Keeping the decoded images alive also avoids discarding them before that render.
let images = []

export async function loadCharacters() {
  store.setState({ charactersStatus: 'loading' })
  try {
    images = await preloadImages(CHARACTER_IMAGES)
    store.setState({ charactersStatus: 'ready' })
  } catch {
    store.setState({ charactersStatus: 'error' })
  }
}
