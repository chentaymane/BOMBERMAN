# Character recordings

Each roster entry specifies a folder under `apps/frontend/assets/characters/`:

```js
{ name: 'Allal', folder: 'allal' }
```

Put the recordings inside that folder using the common names:

- `player.webp`: the character image (already supplied).
- `intro.mp3`: played on every confirmed local character assignment or change.
- `death.mp3`: played when the character loses a life.
- `win.mp3`: played when the character wins the round.

Introduction clips are supplied for Allal, Cheb Larbi, Driss, Mmi Na3ima and
Wldchinwya, inside their character folders as `intro.mp3`. Add the same filename
for another character to enable its intro without changing the roster.
The clip plays for the local player when the server assigns or confirms their
character, including when returning to a previously chosen character.
Switching characters stops the previous intro and cancels its pending playback.

See [assets/README.md](../../assets/README.md) for the full directory layout.
The roster derives every URL. No generated-tone fallback is used. Missing or
invalid recordings stay silent and can be retried on the next matching event.
Reload after replacing a successfully cached recording. The sound toggle
below the board controls the death, victory and introduction recordings.
