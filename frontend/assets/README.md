# Assets

Shared map and bomb textures live in `textures/`. Each character has a folder under
`characters/` with the same three filenames:

```text
assets/
  textures/
    floor.svg
    wall.svg
    brick.svg
    bomb.svg
  characters/
    allal/
      player.webp
      death.mp3
      win.mp3
    bualam/
      player.webp
      death.mp3
      win.mp3
    cheb-larbi/
    driss/
    mmi-na3ima/
    niba/
    nizar/
    san-du-khan/
    wldchinwya/
```

All nine folders contain their existing optimized `player.webp`. Add your actual
recordings as `death.mp3` and `win.mp3` inside the matching folder; no placeholder
MP3s are supplied. Missing audio stays silent and is retryable on a later event.

`data/characters.js` is the only character registry:

```js
{ name: 'Allal', folder: 'allal' }
```

Names, images, death recordings and win recordings are derived from this roster.
Life loss plays the affected character's `death.mp3`. A winner announcement plays
that character's `win.mp3` once per round on connected clients. Draws are silent.
The sound toggle controls both effects; concurrent events can overlap.

Introduction recordings are kept in their own folder per character under
`sounds/`, with the original filename declared as `intro` in the roster:

```text
sounds/
  allal/3lal_20-25.mp3
  cheb-larbi/cheb_larbi_clip_17_to_19.mp3
  driss/audio_00m03s_to_00m05s.mp3
  mmi-na3ima/audio_00m37s_to_00m39s (1).mp3
  wldchinwya/audio_first_3_seconds (1).mp3
```

The local player hears their own clip once, right after the character is
assigned or picked; characters without a clip stay silent.

Image preloading lives in `frontend/game/media.js`. Source PNG
artwork remains separately in `frontend/allal/`.
