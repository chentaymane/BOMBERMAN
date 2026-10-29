# Bomberman DOM

A multiplayer Bomberman game for 2 to 4 players, played in the browser. The last player standing wins.

The game is drawn with plain DOM elements, using our own [mini-framework](frontend/framework/): no canvas, no WebGL and no other framework. Players talk to the server and to each other in real time with WebSockets.

## Features

- **Nickname page** where each player enters a name, then a **waiting room** with a player counter (up to 4 players). Everyone gets a **random free character** and can change it there: a character is locked for the others as soon as somebody takes it.
- **Lobby timers**: when 2 players are in, a 20 s wait starts for more players. Then a 10 s countdown starts the game. With 4 players, the countdown starts right away.
- **Map**: 15 × 13 cells. Walls never move; blocks are placed at random. Every player starts in a corner with two clear cells along each escape corridor.
- **3 lives** per player, and **power-ups** that may appear when a block is destroyed.
- **Chat** for all players, in the waiting room and during the game.
- **Character death sounds:** one MP3 recording per character, played
  when a character loses a life. Use **Sound: on/off** below the board to mute.
  Disconnect forfeits do not trigger death sounds.
  Add recordings using the filenames listed in [data/SOUNDS.md](frontend/data/SOUNDS.md).
- **Rendering**: a `requestAnimationFrame` game loop, at most one render per frame (including chat and input updates), players moved with CSS `transform`, and an FPS counter on screen. See [performance verification](PERFORMANCE.md) for local measurements and limits.
- **Nine characters** from `frontend/allal/`, with optimized transparent WebP copies for the picker, avatars and board. A textured map (grass, stone, bricks), name tags and cross-shaped explosions complete the game interface.

## Requirements

- [Node.js](https://nodejs.org) 18 or newer. The backend uses one package, [ws](https://github.com/websockets/ws), for the WebSocket.
- A modern browser (Chrome, Firefox, Safari or Edge).

## Run the game

```bash
cd backend
npm install
npm start
```

`npm install` is only needed the first time.

Open http://localhost:8080 in 2 to 4 browser tabs, enter a nickname and pick a character in each one, and wait for the countdown.

Friends on the same network can join at `http://<your-computer-ip>:8080`. To use another port, set the `PORT` environment variable.

## How to play

| Key | Action |
| --- | --- |
| Arrow keys | Move (hold to keep moving) |
| Space | Drop a bomb |
| Esc | Leave the chat field and go back to the game |

- A bomb explodes after 3 s. Its flames go in 4 directions and stop at walls, bricks and bombs.
- Flames destroy **bricks** and **players**, and nothing else: power-ups lying on the ground are never burned and the flame goes right over them.
- A bomb hit by a flame is not set off: there are **no chain reactions**.
- If the flames touch you, you lose a life. You go back to your corner and are protected for 2 s (your player blinks).
- With 0 lives you are out, but you can still watch and chat.
- Losing your WebSocket connection while alive in an active match forfeits all
  remaining lives. Your card shows **Forfeit** until the round ends. The last
  survivor wins immediately. Silent network failures are detected by heartbeat
  checks within about 30 seconds; a normal close is handled immediately.

| Power-up | Effect |
| --- | --- |
| 💣 Bombs | Drop one more bomb at a time |
| 🔥 Flames | Explosions reach one more cell |
| ⚡ Speed | Move faster |

## Project structure

See [AUDIT.md](AUDIT.md) for checklist results, viewport screenshots and Chrome
performance tracing evidence.

Start with [ARCHITECTURE.md](ARCHITECTURE.md) for the request flow, module responsibilities, and a guide to making changes.

```text
backend/
  server.js          starts HTTP, WebSockets and the simulation loop
  transport/         HTTP file serving and WebSocket validation
  game/              authoritative rules, state, snapshots and 20 ms loop
  API.md             WebSocket message contract
frontend/
  app.js             connects state, screens, input and networking
  assets/            loads and decodes character images before joining
  screens/           nickname, lobby and game screen composition
  components/        chat shared by lobby and game
  game/              input, animation loop, tiles, players, HUD and results
  network/           WebSocket transport and incoming message handling
  state/             application store, flushed once per animation frame
  data/              character names and image URLs
  styles/            base, lobby, characters, chat, game and accessibility
  allal/             source character PNGs and optimized WebP copies
  textures/          map and bomb SVG textures
  characters/        previous character assets (unused)
  framework/         unchanged core plus reusable socket, batching and image extensions
tests/               game regressions and performance checks
```

## How it works

- **The server decides everything.** The browser sends intentions: `join`, `move` with a direction, `place` for a bomb, and `chat`. Movement and placement have separate queues. The server checks each action against the real map, runs the game every 20 ms and sends the new state only when something changed. All messages are described in [backend/API.md](backend/API.md).
- **The frontend only draws.** Each screen is a function that returns virtual nodes made with `h()`. The framework compares them with the previous ones and only changes the DOM where something is different.
- **Smooth frames.** All store updates are staged immediately and flushed once on the next animation frame. The tile grid and individual cells reuse virtual nodes when their visible classes are unchanged, even across fresh JSON snapshots. Players move with `transform`, which does not trigger page layout.

## Design

- **Classic map** drawn with small SVG textures (no canvas): grass floor, stone walls, brick blocks and bombs. The 9 characters use transparent WebP pictures drawn a bit taller than a cell with their feet on it. Source PNGs are preserved in `frontend/allal/`.
- **Smooth movement**: a player slides to the next cell in exactly the time the server waits between two moves (200 ms, 30 ms less per ⚡ Speed), so holding a key looks like one continuous walk. Explosions are drawn as a cross from the cells that are on fire.
- **Dark, rounded interface** with the [Fredoka](https://fonts.google.com/specimen/Fredoka) font (the system font is used when offline).
- **Readable**: text contrast is at least 6.5:1, buttons and fields are at least 46 px tall, every control has a visible focus ring, and players are told apart by their name tag, not only by color.
- **System settings**: "reduce motion" turns off the animations and the slide, and "increase contrast" makes secondary text and borders stronger.

## Authors

- bguitoni: backend
- chentaymane: frontend
