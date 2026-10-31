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

Only 5 types exist. Anything else is ignored.

### 1. Join with a nickname (character optional)

```js
send({ type: 'join', name: 'bob' })              // random free character
send({ type: 'join', name: 'bob', character: 2 }) // a wanted one
```

- Name: 1–15 characters. Only letters, numbers, spaces, `_` and `-` are allowed.
- Names must be unique, ignoring case (`Bob` and `bob` are the same).
- Character: a number from 1 to 12 (the roster in `frontend/data/characters.js`, pictures and intros in `frontend/assets/characters/`). Two players can not pick the same one.
- **Without a character you get a random free one right away** (any invalid value also means "no choice"). The assigned character is in the answer (`joined`) and can be changed in the waiting room.
- Joining only works while players are waiting (lobby or countdown), with a maximum of 4 players.

### 2. Change character in the waiting room

```js
send({ type: 'pick', character: 3 })
```

- Only while waiting (lobby or countdown). Once the game starts the character is locked.
- Characters already taken by another player are refused with `Character taken, pick another one` and stay locked for everybody.
- A `pick` is answered with a `joined` message (your character), and the new `lobby` is sent to all players.
- The `lobby` message lists `taken`, the characters that are locked, so the picker can grey them out.

### 3. Move

```js
send({ type: 'move', move: 'up' })   // arrow key pressed: 'up' | 'down' | 'left' | 'right'
send({ type: 'move', move: null })   // all arrow keys released
```

- Send **only the direction**. Never send a position: the server knows where you are and checks every move against the real map.
- Moves that are not possible are ignored (wall, block, bomb, too fast, dead player).
- Send a direction once when the key goes down, and `null` when no arrow key is held anymore. **Never repeat it**: the server does the walking.
- Every press gives exactly one step, even a very short tap. While the key stays down the player keeps walking, one step every 200 ms (less with speed power-ups).
- Pressing another arrow while one is held switches direction; releasing it goes back to the one still held (the frontend sends the new direction).

### 4. Place a bomb

```js
send({ type: 'place' })
```

- Places a bomb at your server-known position on the next simulation tick.
- Only living players in an active match can place bombs.
- Placement is independent of movement cooldowns and does not replace a queued direction.
- Bomb capacity and occupied-cell checks still apply. Repeated requests within one tick are combined.
- Space sends one placement request per press; holding Space does not repeat placement.
- `move` accepts directions only; `{ type: "move", move: "bomb" }` is ignored.

### 5. Chat
```js
send({ type: 'chat', text: 'hello' })
```

- Maximum 200 characters, and at most one message every 300ms per player.
- Only players who have joined can chat.

---

## Messages from the server

### `joined`: your nickname was accepted

```json
{ "type": "joined", "name": "bob", "character": 2 }
```

Show the waiting page. Sent again after every `pick`, with the new `character`.

### `error`: something was refused

```json
{ "type": "error", "message": "Nickname taken" }
```

Possible messages: `Nickname required`, `Nickname: 1-15 letters, numbers, space, _ or -`, `Nickname taken`, `Character taken, pick another one`, `No character left`, `Join first`, `Game is full`, `Game already started`.

### `lobby`: waiting room info

Sent each time something changes (player joins or leaves, a second passes, someone picks).

```json
{ "type": "lobby", "players": [{ "name": "bob", "character": 2 }, { "name": "alice", "character": 5 }], "taken": [2, 5], "waitSeconds": 17, "countdown": null }
```

| field         | meaning                                                           |
|---------------|-------------------------------------------------------------------|
| `players`     | players in the lobby (name and character) → counter = `players.length` |
| `taken`       | characters already locked (same order as `players`) → grey these out in the picker |
| `maxPlayers` | room capacity from server configuration; use for slots and the player counter |
| `waitDuration` | total waiting period in seconds; use as the wait progress maximum |
| `readyDuration` | total ready countdown in seconds; use as the ready progress maximum |
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
    { "id": 1, "name": "bob", "character": 2, "x": 1, "y": 1, "lives": 3, "bombs": 1, "range": 1, "speed": 0, "moveDelay": 200, "safe": false }
  ],
  "bombs": [ { "x": 3, "y": 2 } ]
}
```

**`map`** is a matrix: `map[y][x]`. Size is 13 rows × 15 columns.

| symbol         | meaning                                     |
|----------------|---------------------------------------------|
| `#`            | wall (never destroyed, stops flames)        |
| `B`            | block (destroyed by flames, flames stop)    |
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
| `character` | picked character (1–12)                                  |
| `x`,`y` | position (same as in the map)                                 |
| `lives` | lives left (starts at 3, `0` = dead and removed from the map) |
| `forfeited` | `true` when an alive player lost their connection during the match; show "Forfeit" instead of "Out" |
| `bombs` | how many bombs the player can drop at the same time           |
| `range` | explosion range                                               |
| `speed` | speed level (0–4)                                             |
| `moveDelay` | milliseconds between moves, calculated by the server; use for CSS transition duration |
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
  send({ type: 'join', name: myName }) // or { name, character: 1 } to choose
}

socket.onmessage = (event) => {
  const msg = JSON.parse(event.data)
  switch (msg.type) {
    case 'joined': /* show waiting page, msg.character is mine */ break
    case 'error':  alert(msg.message); break
    case 'lobby':  /* show msg.players.length; grey out msg.taken in the picker */ break
    case 'state':  /* draw msg.map, msg.bombs, HUD from msg.players */ break
    case 'chat':   /* add msg.from + msg.text with textContent */ break
    case 'over':   /* show msg.winner */ break
  }
}

// Change character while waiting (refused with an 'error' if somebody took it)
send({ type: 'pick', character: 4 })

const keys = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }
// Simplest version: the keyboard repeats keydown while a key is held, so holding keeps moving
// (the frontend repeats held keys itself every 50 ms, which starts faster than the keyboard)
document.addEventListener('keydown', (e) => {
  if (e.key === ' ' && !e.repeat) send({ type: 'place' })
  else if (keys[e.key]) send({ type: 'move', move: keys[e.key] })
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
| closing the tab while alive during a game | all remaining lives are forfeited; the last survivor wins |

The server sends WebSocket ping frames every 15 seconds. Browsers answer pong
frames automatically. A connection that has not answered by the next check is
terminated and handled as a disconnect (within about 30 seconds of a silent
network loss). No extra application JSON messages or client connection are needed.

Forfeited players remain in game snapshots with `lives: 0` and `forfeited: true`
until the round ends. Their pending movement/placement requests are cleared;
bombs they already placed keep their fuses. Disconnected players receive no
further messages and are removed before the next lobby counter is calculated.
An already eliminated spectator leaving does not count as a forfeit. Disconnects
after a match has ended do not change its winner or restart its result timer.
