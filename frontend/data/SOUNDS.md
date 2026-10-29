# Character recordings

Each roster entry specifies a folder under `frontend/assets/characters/`:

```js
{ name: 'Allal', folder: 'allal' }
```

Put the recordings inside that folder using the common names:

- `player.webp`: the character image (already supplied).
- `death.mp3`: played when the character loses a life.
- `win.mp3`: played when the character wins the round.

See [assets/README.md](../assets/README.md) for the full directory layout.
The roster derives every URL. No generated-tone fallback is used. Missing or
invalid recordings stay silent and can be retried on the next matching event.
Reload after replacing a successfully cached recording. The sound toggle
below the board controls both death and victory recordings.
