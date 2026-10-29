// Character IDs are the roster index + 1. Names, images and MP3s all derive here.
const roster = [
  { name: 'Allal', file: 'allal', sound: 'allal.mp3' },
  { name: 'Bualam', file: 'bualam', sound: 'bualam.mp3' },
  { name: 'Cheb Larbi', file: 'cheb-larbi', sound: 'cheb-larbi.mp3' },
  { name: 'Driss', file: 'driss', sound: 'driss.mp3' },
  { name: 'Mmi Na3ima', file: 'mmi-na3ima', sound: 'mmi-na3ima.mp3' },
  { name: 'Niba', file: 'niba', sound: 'niba.mp3' },
  { name: 'Nizar', file: 'nizar', sound: 'nizar.mp3' },
  { name: 'San Du Khan', file: 'san-du-khan', sound: 'san-du-khan.mp3' },
  { name: 'Wldchinwya', file: 'wldchinwya', sound: 'wldchinwya.mp3' },
]

export const CHARACTERS = roster.map(character => character.name)
export const CHARACTER_IMAGES = roster.map(character =>
  new URL(`../data/optimized/${character.file}.webp`, import.meta.url).href,
)

export const DEATH_SOUNDS = Object.fromEntries(roster.map((character, index) => [
  index + 1,
  new URL(`./${character.sound}`, import.meta.url).href,
]))
