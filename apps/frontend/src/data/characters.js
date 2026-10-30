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

export const CHARACTERS = roster.map((character, index) => {
  const folder = new URL(`../../assets/characters/${character.folder}/`, import.meta.url)
  const image = new URL('player.webp', folder).href
  return {
    ...character,
    id: index + 1,
    image,
    deathSound: new URL('death.mp3', folder).href,
    winSound: new URL('win.mp3', folder).href,
    introSound: new URL('intro.mp3', folder).href,
    style: { '--character-image': `url("${image}")` },
  }
})
