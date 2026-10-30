// Character IDs are the roster index + 1. Names, images and MP3s all derive here.
// `intro` is the optional introduction recording inside assets/sounds/<folder>/;
// characters without one simply stay silent.
const roster = [
  { name: 'Allal', folder: 'allal', intro: '3lal_20-25.mp3' },
  { name: 'Bualam', folder: 'bualam' },
  { name: 'Cheb Larbi', folder: 'cheb-larbi', intro: 'cheb_larbi_clip_17_to_19.mp3' },
  { name: 'Driss', folder: 'driss', intro: 'audio_00m03s_to_00m05s.mp3' },
  { name: 'Mmi Na3ima', folder: 'mmi-na3ima', intro: 'audio_00m37s_to_00m39s (1).mp3' },
  { name: 'Niba', folder: 'niba' },
  { name: 'Nizar', folder: 'nizar' },
  { name: 'San Du Khan', folder: 'san-du-khan' },
  { name: 'Wldchinwya', folder: 'wldchinwya', intro: 'audio_first_3_seconds (1).mp3' },
]

export const CHARACTERS = roster.map((character, index) => {
  const folder = new URL(`../assets/characters/${character.folder}/`, import.meta.url)
  const sounds = new URL(`../assets/sounds/${character.folder}/`, import.meta.url)
  const image = new URL('player.webp', folder).href
  return {
    ...character,
    id: index + 1,
    image,
    deathSound: new URL('death.mp3', folder).href,
    winSound: new URL('win.mp3', folder).href,
    introSound: character.intro ? new URL(character.intro, sounds).href : null,
    style: { '--character-image': `url("${image}")` },
  }
})
