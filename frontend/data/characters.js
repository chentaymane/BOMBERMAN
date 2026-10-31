// Character IDs are the roster index + 1 (keep CHARACTERS in backend/game/config.js in sync). Names, images and sounds all derive here.
// Each folder in assets/characters/ holds player.webp and intro.mp3
const roster = [
  { name: 'Allal', folder: 'allal' },
  { name: 'Chinwi', folder: 'chinwi' },
  { name: 'Bualam', folder: 'bualam' },
  { name: 'Cheb Larbi', folder: 'cheb-larbi' },
  { name: 'Driss', folder: 'driss' },
  { name: 'Messi', folder: 'messi' },
  { name: 'Mmi Na3ima', folder: 'mmi-na3ima' },
  { name: 'Niba', folder: 'niba' },
  { name: 'Nizar', folder: 'nizar' },
  { name: 'Playza', folder: 'playza' },
  { name: 'San Du Khan', folder: 'san-du-khan' },
  { name: 'Wldchinwya', folder: 'wldchinwya' },
]

export const CHARACTERS = roster.map((character, index) => {
  const file = name => new URL(`../assets/characters/${character.folder}/${name}`, import.meta.url).href
  const image = file('player.webp')
  return {
    ...character,
    id: index + 1,
    image,
    intro: file('intro.mp3'),
    style: { '--character-image': `url("${image}")` },
  }
})
