# Character recordings

Each roster entry specifies a folder under `frontend/assets/characters/`:

```js
{ name: 'Allal', folder: 'allal' }
```

Put the recordings inside that folder using the common names:

- `player.webp`: the character image (already supplied).
- `death.mp3`: played when the character loses a life.
- `win.mp3`: played when the character wins the round.

Introduction clips live in a separate tree, one folder per character, and keep
their original filename, declared as `intro` in the roster:

```js
{ name: 'Allal', folder: 'allal', intro: '3lal_20-25.mp3' }
```

```text
assets/sounds/allal/3lal_20-25.mp3
assets/sounds/cheb-larbi/cheb_larbi_clip_17_to_19.mp3
assets/sounds/driss/audio_00m03s_to_00m05s.mp3
assets/sounds/mmi-na3ima/audio_00m37s_to_00m39s (1).mp3
assets/sounds/wldchinwya/audio_first_3_seconds (1).mp3
```

A character without `intro` (Bualam, Niba, Nizar, San Du Khan) stays silent.
The clip plays once for the local player, right after the server assigns or a
pick changes that player's character — never during gameplay, and never twice
for the same character in one page session.

See [assets/README.md](../assets/README.md) for the full directory layout.
The roster derives every URL. No generated-tone fallback is used. Missing or
invalid recordings stay silent and can be retried on the next matching event.
Reload after replacing a successfully cached recording. The sound toggle
below the board controls the death, victory and introduction recordings.
