# Character recordings

Each roster entry specifies a folder under `frontend/assets/characters/`:

```js
{ name: 'Allal', folder: 'allal' }
```

Put the recordings inside that folder using the common names:

- `player.webp`: the character image (already supplied).
- `intro.mp3`: played once per local character in a page session on assignment.
- `death.mp3`: played when the character loses a life.
- `win.mp3`: played when the character wins the round.

Introduction clips are supplied for Allal, Cheb Larbi, Driss, Mmi Na3ima and
Wldchinwya, inside their character folders as `intro.mp3`. Add the same filename
for another character to enable its intro without changing the roster.
The clip plays for the local player when the server assigns or confirms their
character. Repeated assignments stay silent after successful playback.

See [assets/README.md](../assets/README.md) for the full directory layout.
The roster derives every URL. No generated-tone fallback is used. Missing or
invalid recordings stay silent and can be retried on the next matching event.
Reload after replacing a successfully cached recording. The sound toggle
below the board controls the death, victory and introduction recordings.
