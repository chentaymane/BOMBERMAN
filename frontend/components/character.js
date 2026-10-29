import { h } from '../framework/index.js'
import { CHARACTER_IMAGES } from '../data/characters.js'

export function characterStyle(id) {
  const image = CHARACTER_IMAGES[id - 1]
  return image ? { '--character-image': `url("${image}")` } : {}
}

export function avatarView(id) {
  return h('span', { class: 'avatar c' + id, style: characterStyle(id) })
}
