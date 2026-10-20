# Bomberman Backend – Frontend Guide

## Start the server

```bash
npm install        # only the first time (installs the ws library)
npm start          # or: node server.js
```

The server listens on `ws://localhost:8080`; set the `PORT` env variable to change the port.

All communication goes through **one WebSocket**. Every message is **JSON**, in both directions.

```js
const socket = new WebSocket('ws://localhost:8080')

function send(data) {
  socket.send(JSON.stringify(data))
}

socket.onmessage = (event) => {
  const msg = JSON.parse(event.data)
  // check msg.type (see "Messages from the server")
}
```

---

## Messages you send

Only 3 types exist. Anything else is ignored.

### 1. Join with a nickname

```js
send({ type: 'join', name: 'bob' })
```

- Name: 1–15 characters. Only letters, numbers, spaces, `_` and `-` are allowed.
- Names must be unique, ignoring case (`Bob` and `bob` are the same).
- Joining only works while players are waiting (lobby or countdown), with a maximum of 4 players.

### 2. Move or drop a bomb

```js
send({ type: 'move', move: 'up' })   // 'up' | 'down' | 'left' | 'right' | 'bomb'
```

- Send **only the direction**. Never send a position: the server knows where you are and checks every move against the real map.
- Moves that are not possible are ignored (wall, block, bomb, too fast, dead player).
- The server waits a short time between two moves of the same player (200ms, less with speed power-ups). Sending faster does nothing, except one move is kept and played when the wait is over.
- Send a move on `keydown`, and again on key repeat while the key is held. **Do not send a move on every frame.**

### 3. Chat

```js
send({ type: 'chat', text: 'hello' })
```

- Maximum 200 characters, and at most one message every 300ms per player.
- Only players who have joined can chat.

---

## Messages from the server

### `joined`: your nickname was accepted

```json
{ "type": "joined", "name": "bob" }
```

Show the waiting page.

### `error`: something was refused

```json
{ "type": "error", "message": "Nickname taken" }
```

Possible messages: `Nickname required`, `Nickname: 1-15 letters, numbers, space, _ or -`, `Nickname taken`, `Game is full`, `Game already started`.

### `lobby`: waiting room info

Sent each time something changes (player joins or leaves, a second passes).

```json
{ "type": "lobby", "players": ["bob", "alice"], "waitSeconds": 17, "countdown": null }
```

| field         | meaning                                                           |
|---------------|-------------------------------------------------------------------|
| `players`     | names of the players in the lobby → counter = `players.length`    |
| `waitSeconds` | seconds left of the 20s wait for more players, `null` if not running |
| `countdown`   | seconds left of the 10s "get ready" timer, `null` if not running  |

How the lobby works:
- When 2 players are in, the 20s wait starts.
- When the wait ends, or when 4 players are in, the 10s countdown starts.
- When the countdown ends, the game starts.

### `state`: the game

Sent while the game runs, only when something changed.

```json
{
  "type": "state",
  "map": [
    ["#","#","#","#"],
    ["#","1",".","B"],
    ["#",".","#","X"]
  ],
  "players": [
    { "id": 1, "name": "bob", "x": 1, "y": 1, "lives": 3, "bombs": 1, "range": 1, "speed": 0, "safe": false }
  ],
  "bombs": [ { "x": 3, "y": 2 } ]
}
```

**`map`** is a matrix: `map[y][x]`. Size is 13 rows × 15 columns.

| symbol         | meaning                                     |
|----------------|---------------------------------------------|
| `#`            | wall (can never be destroyed)               |
| `B`            | block (destroyed by bombs)                  |
| `.`            | empty                                       |
| `X`            | bomb                                        |
| `F`            | fire / explosion                            |
| `b`            | power-up: +1 bomb at a time                 |
| `f`            | power-up: +1 explosion range                |
| `s`            | power-up: more speed                        |
| `1` `2` `3` `4`| player with that `id`                       |

**`players`**: info for the HUD.

| field   | meaning                                                       |
|---------|---------------------------------------------------------------|
| `id`    | number shown in the map (`1`–`4`), also gives the start corner |
| `x`,`y` | position (same as in the map)                                 |
| `lives` | lives left (starts at 3, `0` = dead and removed from the map) |
| `bombs` | how many bombs the player can drop at the same time           |
| `range` | explosion range                                               |
| `speed` | speed level (0–4)                                             |
| `safe`  | `true` = cannot be hit (2s after losing a life), so make the player blink |

**`bombs`**: list of all bombs on the map. Use it to draw bombs, because when a player stands on a bomb, the map shows the player and not the bomb.

To find **your own player**, look for your name: `msg.players.find(p => p.name === myName)`.

### `chat`: a chat message

```json
{ "type": "chat", "from": "bob", "text": "hello" }
```

Show the text as plain text (`textContent`). **Never use `innerHTML`**: it would let a player inject HTML into other players' pages.

### `over`: game finished

```json
{ "type": "over", "winner": "bob" }
```

`winner` can be `null` if nobody survived. After 5 seconds the server goes back to the lobby: you will receive a `lobby` message again, with the same players still connected.

---

## Full minimal example

```js
const socket = new WebSocket('ws://localhost:8080')
const send = (data) => socket.send(JSON.stringify(data))
let myName = ''

socket.onopen = () => {
  myName = 'bob'
  send({ type: 'join', name: myName })
}

socket.onmessage = (event) => {
  const msg = JSON.parse(event.data)
  switch (msg.type) {
    case 'joined': /* show waiting page */ break
    case 'error':  alert(msg.message); break
    case 'lobby':  /* show msg.players.length, msg.waitSeconds, msg.countdown */ break
    case 'state':  /* draw msg.map, msg.bombs, HUD from msg.players */ break
    case 'chat':   /* add msg.from + msg.text with textContent */ break
    case 'over':   /* show msg.winner */ break
  }
}

const keys = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', ' ': 'bomb' }
document.addEventListener('keydown', (e) => {
  if (keys[e.key]) send({ type: 'move', move: keys[e.key] })
})
```

---

## Limits (the server protects itself)

| rule                              | what happens                     |
|-----------------------------------|----------------------------------|
| more than 60 messages / second    | extra messages are ignored       |
| more than 200 messages / second   | you are disconnected             |
| message bigger than 4KB           | you are disconnected             |
| more than 50 connections at once  | new connections are refused      |
| closing the tab during a game     | you are removed from the game    |
