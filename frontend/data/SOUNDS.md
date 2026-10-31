# Character sounds

Each character folder in `frontend/assets/characters/<folder>/` can hold:

- `player.webp`: the character image.
- `intro.mp3`: plays every time you get or pick this character.
- `damage.mp3`: plays when this character loses a life (hit by a bomb).
- `kill.mp3`: plays when this character loses its last life.
- `win.mp3`: plays when this character wins the round.

Missing files stay silent, so just drop a file in the folder to enable it.
Sounds are played with `playSound` / `muteSounds` from `frontend/lib/sound.js`.
