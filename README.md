# Bomberman DOM

A multiplayer Bomberman game for 2 to 4 players, played in the browser. The last player standing wins.

The game is drawn with plain DOM elements, using our own [mini-framework](frontend/framework/): no canvas, no WebGL and no other framework. Players talk to the server and to each other in real time with WebSockets.

## Features

- **Nickname page** where each player also picks one of 6 characters (two players can not take the same one), then a **waiting room** with a player counter (up to 4 players).
- **Lobby timers**: when 2 players are in, a 20 s wait starts for more players. Then a 10 s countdown starts the game. With 4 players, the countdown starts right away.
- **Map**: 15 × 13 cells. Walls never move; blocks are placed at random. Every player starts in a corner with room to escape their first bomb.
- **3 lives** per player, and **power-ups** that may appear when a block is destroyed.
- **Chat** for all players, in the waiting room and during the game.
- **60 FPS**: a `requestAnimationFrame` game loop, at most one render per frame, players moved with CSS `transform`, and an FPS counter on screen.
- **Classic Bomberman look**: a textured map (grass, stone, bricks), the picked characters with name tags, cross-shaped explosions, and a dark, rounded game interface.

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

- A bomb explodes after 3 s. Its flames go in 4 directions and stop at walls and blocks.
- If the flames touch you, you lose a life. You go back to your corner and are protected for 2 s (your player blinks).
- With 0 lives you are out, but you can still watch and chat.

| Power-up | Effect |
| --- | --- |
| 💣 Bombs | Drop one more bomb at a time |
| 🔥 Flames | Explosions reach one more cell |
| ⚡ Speed | Move faster |

## Project structure

```
backend/
  server.js       HTTP server: sends the frontend files and accepts the WebSocket (ws library)
  game.js         all game rules: lobby, map, moves, bombs, lives, power-ups
  API.md          every message between the browser and the server
frontend/
  index.html      the page
  style.css       design: dark game theme, map, players, chat
  textures/       SVG textures: floor, wall, brick and bomb
  characters/     the 6 characters players can pick (1.webp to 6.webp)
  app.js          entry point: server messages, screens, game loop
  socket.js       WebSocket connection
  store.js        app state
  login.js        nickname page
  lobby.js        waiting room
  game.js         board, players and game over
  chat.js         chat
  controls.js     keyboard controls
  framework/      the mini-framework (virtual DOM, state, events, router)
```

## How it works

- **The server decides everything.** The browser only sends what the player wants to do (`join`, `move` with a direction, `chat`). The server checks every move against the real map, runs the game every 20 ms and sends the new state only when something changed. All messages are described in [backend/API.md](backend/API.md).
- **The frontend only draws.** Each screen is a function that returns virtual nodes made with `h()`. The framework compares them with the previous ones and only changes the DOM where something is different.
- **Smooth frames.** The newest game state is kept and drawn on the next animation frame, so there is never more than one render per frame. The map grid is rebuilt only when the map changes, and players move with `transform`, which does not trigger page layout.

## Design

- **Classic map** drawn with small SVG textures (no canvas): grass floor, stone walls, brick blocks and bombs. The 6 characters are pictures with a transparent background, drawn a bit taller than a cell with their feet on it, like classic game sprites.
- **Smooth movement**: a player slides to the next cell in exactly the server's move delay, so holding a key looks like one continuous walk. Explosions are drawn as a cross from the cells that are on fire.
- **Dark, rounded interface** with the [Fredoka](https://fonts.google.com/specimen/Fredoka) font (the system font is used when offline).
- **Readable**: text contrast is at least 6.5:1, buttons and fields are at least 46 px tall, every control has a visible focus ring, and players are told apart by their name tag, not only by color.
- **System settings**: "reduce motion" turns off the animations and the slide, and "increase contrast" makes secondary text and borders stronger.

## Authors

- bguitoni: backend
- chentaymane: frontend
