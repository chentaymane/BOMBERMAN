# Bomberman DOM

A browser-based multiplayer Bomberman game for 2 to 4 players. Destroy blocks,
collect power-ups and survive until you are the last player standing.

The interface uses our custom [mini-framework](frontend/framework/), reusable
browser [extensions](frontend/lib/), DOM elements and CSS. There is no canvas, WebGL or third-party UI framework. The Node.js
server uses [ws](https://github.com/websockets/ws) for real-time communication.

## Run locally

Requires Node.js 18 or newer and a modern browser.

```sh
cd backend
npm install
npm start
```

Open **http://localhost:8080** in separate browser tabs or private windows.
Players on the same network can join at `http://<server-ip>:8080`.
Set the `PORT` environment variable to change the listening port.

## Join a game

1. Enter a unique nickname.
2. Choose one of nine characters in the waiting room. Taken characters are locked.
3. Chat with the other players while waiting for the round to start.

When the second player joins, a 20-second wait starts, followed by a 10-second
ready countdown. If four players join earlier, the ready countdown starts
immediately. Each player starts in a different corner with three lives.

## Controls

| Control | Action |
| --- | --- |
| Arrow keys | Move; hold to keep moving |
| Space | Place a bomb |
| Esc | Leave the chat input and return to game controls |
| Sound button | Mute or unmute character recordings |

## Game rules

- The fixed 15 ? 13 map contains permanent walls and randomly placed destructible blocks.
- Starting corners have clear escape routes. The board scales to the viewport.
- Bombs explode after three seconds. Flames extend in four directions and stop
  at walls, blocks and other bombs. Bombs do not trigger chain reactions.
- Being caught in flames costs one life. Surviving players respawn at their
  corner with two seconds of protection.
- At zero lives, you can watch and chat but cannot move or place bombs.
- Losing your WebSocket connection while alive forfeits your remaining lives.
  Silent network failures are detected through heartbeat checks within about
  30 seconds. Normal connection closes are handled immediately.
- The last survivor wins. After the result screen, connected players return
  to the waiting room for another round.

Destroyed blocks may reveal power-ups. Items already on the ground are not
destroyed by flames.

| Power-up | Effect |
| --- | --- |
| Bombs | Increases simultaneous bomb capacity |
| Flames | Increases explosion range |
| Speed | Reduces the delay between movement steps |

## Character assets

Each character has a folder under `frontend/assets/characters/`:

```text
frontend/assets/characters/allal/
  player.webp
  intro.mp3
  death.mp3
  win.mp3
```

The roster in [characters.js](frontend/data/characters.js) is the single source
of character names and folder names:

```js
{ name: 'Allal', folder: 'allal' }
```

Images and five intro recordings are provided. Add recordings as `intro.mp3`,
`death.mp3` and `win.mp3` in each folder. Missing audio stays silent.
Intros play once per character for the local player in each page session,
when the server assigns or confirms their selection. Death recordings play on life loss;
victory recordings play once when a winner is announced. Forfeits are silent.
See the [asset guide](frontend/assets/README.md) for the complete layout.

## Project structure

```text
backend/
  server.js       application startup
  transport/      HTTP file serving and WebSocket connections
  game/           authoritative rules, state and simulation loop
  API.md          WebSocket message contract
frontend/
  app.js          startup, screen selection and animation frames
  assets/
    characters/   one folder per character
    textures/     shared map and bomb SVGs
  data/           shared character roster
  store.js        application state
  socket.js       connection and incoming message handling
  views/          login, waiting room, game and chat markup
  game/           keyboard controls, cached tiles and media loading/playback
  styles/         styles grouped by purpose
  framework/      custom framework core (unchanged)
  lib/            reusable browser extensions (socket, batched store, audio, images)
  allal/          original character PNG artwork
```

## Architecture and performance

The server validates player intentions and advances the simulation every 20 ms.
Movement and bomb placement use separate commands. Clients render server
snapshots; they do not decide positions, damage or winners.

Browser updates are batched into one render per animation frame. Unchanged
tiles reuse virtual nodes, and player animation uses CSS transforms. The FPS
counter provides a live indication of rendering frequency. The target is at
least 60 FPS; actual performance depends on the device and browser.

- [Architecture and module responsibilities](ARCHITECTURE.md)
- [WebSocket API](backend/API.md)
- [Framework extension APIs](frontend/lib/EXTENSIONS.md)
- [Performance notes](PERFORMANCE.md)

## Authors

- **bguitoni:** backend.
- **chentaymane:** frontend.
- **ahaddou:** frontend/backend refactoring, rendering performance improvements,
  character integration and shared roster, reusable framework extensions,
  separate movement/placement commands, WebSocket disconnect forfeits and MP3
  sound integration.
