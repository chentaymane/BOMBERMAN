# Bomberman DOM

A browser-based multiplayer Bomberman game for 2 to 4 players. Destroy blocks,
collect power-ups and survive until you are the last player standing.

The interface uses our custom [mini-framework](frontend/framework/) plus two tiny
helpers in [lib/](frontend/lib/) (WebSocket and sound), DOM elements and CSS. There is no canvas, WebGL or third-party UI framework. The Node.js
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
2. Choose one of twelve characters in the waiting room. Taken characters are locked.
3. Chat with the other players while waiting for the round to start.

When the second player joins, a 20-second wait starts, followed by a 10-second
ready countdown. If four players join earlier, the ready countdown starts
immediately. Each player starts in a different corner with three lives.

## Controls

| Control | Action |
| --- | --- |
| Arrow keys | One step per press; hold (over 0.3 s) to keep walking |
| Space | Place a bomb |
| Esc | Leave the chat input and return to game controls |
| Sound button | Mute or unmute the character intros |

## Game rules

- The fixed 15 × 13 map contains permanent walls and randomly placed destructible blocks.
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
  player.webp   the character picture
  intro.mp3     plays every time you get or pick this character
```

The roster in [characters.js](frontend/data/characters.js) is the single source
of character names and folder names:

```js
{ name: 'Allal', folder: 'allal' }
```

A missing intro stays silent. The sound button (waiting room and game) mutes it.

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
  lib/            small helpers outside the framework (socket.js, sound.js)
```

## Architecture and performance

The server validates player intentions and advances the simulation every 20 ms.
Movement and bomb placement use separate commands. Clients render server
snapshots; they do not decide positions, damage or winners.

Browser updates are batched into one render per animation frame. Unchanged
tiles reuse virtual nodes, and player animation uses CSS transforms. Check the
frame rate with the browser DevTools (Performance tab, frame rendering stats).

Paint and layers are kept low on purpose: the map has its own layer, so a bomb or a
flame repaints only the map; players move with `transform` on their own layers;
the only looping animations (ticking bomb, blinking after a hit) are
transform/opacity animations that run on the compositor.

- [WebSocket API](backend/API.md)

## Authors

- **bguitoni:** backend.
- **chentaymane:** frontend.
- **ahaddou:** frontend/backend refactoring, rendering performance improvements,
  character integration and shared roster, reusable framework extensions,
  separate movement/placement commands, WebSocket disconnect forfeits and MP3
  sound integration.
