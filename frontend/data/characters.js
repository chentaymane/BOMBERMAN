// Character IDs are the roster index + 1. Names, images and MP3s all derive here.
const roster = [
  { name: 'Allal', folder: 'allal' },
  { name: 'Bualam', folder: 'bualam' },
  { name: 'Cheb Larbi', folder: 'cheb-larbi' },
  { name: 'Driss', folder: 'driss' },
  { name: 'Mmi Na3ima', folder: 'mmi-na3ima' },
  { name: 'Niba', folder: 'niba' },
  { name: 'Nizar', folder: 'nizar' },
  { name: 'San Du Khan', folder: 'san-du-khan' },
  { name: 'Wldchinwya', folder: 'wldchinwya' },
]

export const CHARACTERS = roster.map(character => character.name)

function assetUrls(filename) {
  return roster.map(character =>
    new URL(`../assets/${character.folder}/${filename}`, import.meta.url).href,
  )
}

function soundMap(filename) {
  return Object.fromEntries(assetUrls(filename).map((url, index) => [index + 1, url]))
}

export const CHARACTER_IMAGES = assetUrls('player.webp')
export const DEATH_SOUNDS = soundMap('death.mp3')
export const WIN_SOUNDS = soundMap('win.mp3')
