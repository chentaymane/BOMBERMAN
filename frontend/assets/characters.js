import { CHARACTER_IMAGES } from '../data/characters.js'
import { store } from '../state/store.js'
import { preloadImages } from '../framework/images.js'

// Decode before allowing entry to the lobby, where CSS backgrounds first appear.
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
