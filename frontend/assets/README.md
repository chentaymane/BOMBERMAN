# Assets

Shared map and bomb textures live in `textures/`. Each character has a folder under
`characters/` with standard filenames:

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
      intro.mp3
      death.mp3
      win.mp3
    bualam/
      player.webp
      intro.mp3
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

All nine folders contain their existing optimized `player.webp`. Intro recordings
are supplied for Allal, Cheb Larbi, Driss, Mmi Na3ima and Wldchinwya. Add recordings
as `intro.mp3`, `death.mp3` and `win.mp3` inside the matching character folder.
Missing audio stays silent and is retryable on a later event.

`data/characters.js` is the only character registry:

```js
{ name: 'Allal', folder: 'allal' }
```

Names, images and all recording URLs are derived from this roster.
Life loss plays the affected character's `death.mp3`. A winner announcement plays
that character's `win.mp3` once per round on connected clients. Draws are silent.
The sound toggle controls all recordings; concurrent events can overlap.

The local player hears their own `intro.mp3` once per character in a page session,
right after the character is assigned or picked. Missing clips stay silent.

Image preloading lives in `frontend/game/media.js`. Source PNG
artwork remains separately in `frontend/allal/`.
