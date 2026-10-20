// All game rules live here: lobby, map, moves, bombs, lives.
//
// The server is the only source of truth. Clients only say what they WANT
// to do; the wish is stored and then checked against the real map inside
// tick(). All state changes happen in tick(), one step at a time, in a fixed
// order, so two messages can never change the game "at the same time".

// ----- Settings -----
const WIDTH = 15
const HEIGHT = 13
const LIVES = 3
const MAX_PLAYERS = 4
const TICK = 20 // game loop speed (ms)
const WAIT_TIME = 20000 // wait for more players (ms)
const READY_TIME = 10000 // countdown before start (ms)
const OVER_TIME = 5000 // show winner, then back to lobby (ms)
const BOMB_TIME = 3000 // bomb explodes after (ms)
const FIRE_TIME = 500 // flames stay (ms)
const SAFE_TIME = 2000 // invincible after losing a life (ms)
const MOVE_DELAY = 200 // ms between moves
const SPEED_STEP = 30 // each speed power up removes this from MOVE_DELAY
const MAX_BOMBS = 8
const MAX_RANGE = 8
const MAX_SPEED = 4
const CHAT_DELAY = 300 // ms between chat messages
const NAME_RULE = /^[\p{L}\p{N} _-]{1,15}$/u

// ----- Map symbols -----
const EMPTY = '.'
const WALL = '#' // can not be destroyed
const BLOCK = 'B' // can be destroyed
const BOMB = 'X'
const FIRE = 'F'
const POWER_BOMB = 'b' // +1 bomb at a time
const POWER_FLAME = 'f' // +1 explosion range
const POWER_SPEED = 's' // faster moves
// Players are shown in the map as '1', '2', '3', '4'

const CORNERS = [
  [1, 1],
  [WIDTH - 2, 1],
  [1, HEIGHT - 2],
  [WIDTH - 2, HEIGHT - 2],
]

const DIRECTIONS = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
}

// ----- State -----
let phase = 'lobby' // 'lobby' | 'countdown' | 'playing' | 'over'
let players = [] // { client, name, id, x, y, lives, ... }
let tiles = [] // tiles[y][x] = EMPTY | WALL | BLOCK | power up
let fireUntil = [] // fireUntil[y][x] = time the fire on this cell ends
let bombs = [] // { x, y, owner, range, explodeAt }
let waitEndsAt = 0
let startsAt = 0
let overEndsAt = 0
const lastSent = new Map() // client -> last message, to send only changes

// ----- Map -----
function nearCorner(x, y) {
  // Corner cell and its 2 neighbours stay empty, so players can escape
  return CORNERS.some(([cx, cy]) => Math.abs(cx - x) + Math.abs(cy - y) <= 1)
}

function createMap() {
  tiles = []
  fireUntil = []
  for (let y = 0; y < HEIGHT; y++) {
    const row = []
    for (let x = 0; x < WIDTH; x++) {
      const border = x === 0 || y === 0 || x === WIDTH - 1 || y === HEIGHT - 1
      const pillar = x % 2 === 0 && y % 2 === 0
      if (border || pillar) row.push(WALL)
      else if (!nearCorner(x, y) && Math.random() < 0.7) row.push(BLOCK)
      else row.push(EMPTY)
    }
    tiles.push(row)
    fireUntil.push(new Array(WIDTH).fill(0))
  }
}

// The matrix sent to clients: tiles + bombs + fire + players
function buildMatrix(now) {
  const matrix = tiles.map((row, y) => row.map((tile, x) => (fireUntil[y][x] > now ? FIRE : tile)))
  for (const b of bombs) matrix[b.y][b.x] = BOMB
  for (const p of players) if (p.lives > 0) matrix[p.y][p.x] = String(p.id)
  return matrix
}

// ----- Helpers -----
function send(client, message) {
  client.send(JSON.stringify(message))
}

function broadcast(message) {
  const text = JSON.stringify(message)
  for (const p of players) p.client.send(text)
}

function findPlayer(client) {
  return players.find((p) => p.client === client)
}

function inside(x, y) {
  return x >= 0 && y >= 0 && x < WIDTH && y < HEIGHT
}

function bombAt(x, y) {
  return bombs.find((b) => b.x === x && b.y === y)
}

function isPowerUp(tile) {
  return tile === POWER_BOMB || tile === POWER_FLAME || tile === POWER_SPEED
}

function cleanText(text, max) {
  // Remove invisible control characters, keep normal text
  return text.replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e]/g, '').trim().slice(0, max)
}

// ----- Lobby -----
function join(client, name) {
  if (findPlayer(client)) return
  if (typeof name !== 'string') return send(client, { type: 'error', message: 'Nickname required' })
  name = cleanText(name, 100) // too long names fail NAME_RULE below
  if (!NAME_RULE.test(name)) {
    return send(client, { type: 'error', message: 'Nickname: 1-15 letters, numbers, space, _ or -' })
  }
  if (phase !== 'lobby' && phase !== 'countdown') return send(client, { type: 'error', message: 'Game already started' })
  if (players.length >= MAX_PLAYERS) return send(client, { type: 'error', message: 'Game is full' })
  if (players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
    return send(client, { type: 'error', message: 'Nickname taken' })
  }

  players.push({ client, name, lives: 0, lastChatAt: 0 })
  send(client, { type: 'joined', name })
  checkLobby()
}

function checkLobby() {
  if (phase !== 'lobby') return
  if (players.length === MAX_PLAYERS) startCountdown()
  else if (players.length < 2) waitEndsAt = 0
  else if (!waitEndsAt) waitEndsAt = Date.now() + WAIT_TIME
}

function startCountdown() {
  phase = 'countdown'
  waitEndsAt = 0
  startsAt = Date.now() + READY_TIME
}

function startGame() {
  phase = 'playing'
  createMap()
  bombs = []
  players.forEach((p, i) => {
    p.id = i + 1
    p.x = CORNERS[i][0]
    p.y = CORNERS[i][1]
    p.lives = LIVES
    p.maxBombs = 1
    p.range = 1
    p.speed = 0
    p.nextMoveAt = 0
    p.safeUntil = 0
    p.wantedMove = null
    p.wantsBomb = false
  })
}

function leave(client) {
  players = players.filter((p) => p.client !== client)
  lastSent.delete(client)
  if (phase === 'countdown' && players.length < 2) phase = 'lobby'
  checkLobby()
  // During a game, tick() sees the missing player and checks for a winner
}

// ----- Player input (only stored here, used in tick) -----
// move = 'up' | 'down' | 'left' | 'right' | 'bomb'
function queueMove(client, move) {
  const p = findPlayer(client)
  if (phase !== 'playing' || !p || p.lives <= 0 || typeof move !== 'string') return
  if (move === 'bomb') p.wantsBomb = true
  else if (Object.hasOwn(DIRECTIONS, move)) p.wantedMove = move // last wish wins
}

function chat(client, text) {
  const p = findPlayer(client)
  if (!p || typeof text !== 'string') return
  const now = Date.now()
  if (now - p.lastChatAt < CHAT_DELAY) return // spam
  text = cleanText(text, 200)
  if (!text) return
  p.lastChatAt = now
  broadcast({ type: 'chat', from: p.name, text })
}

// ----- Game rules (only called from tick) -----
function applyInputs(now) {
  for (const p of players) {
    if (p.lives <= 0) continue

    if (p.wantsBomb) {
      p.wantsBomb = false
      placeBomb(p, now)
    }

    // On cooldown: keep the wish, try again next tick
    if (p.wantedMove && now >= p.nextMoveAt) {
      tryMove(p, DIRECTIONS[p.wantedMove], now)
      p.wantedMove = null
    }
  }
}

function tryMove(p, [dx, dy], now) {
  const x = p.x + dx
  const y = p.y + dy
  if (!inside(x, y)) return
  const tile = tiles[y][x]
  if (tile === WALL || tile === BLOCK || bombAt(x, y)) return

  p.x = x
  p.y = y
  p.nextMoveAt = now + MOVE_DELAY - p.speed * SPEED_STEP

  if (tile === POWER_BOMB) p.maxBombs = Math.min(MAX_BOMBS, p.maxBombs + 1)
  if (tile === POWER_FLAME) p.range = Math.min(MAX_RANGE, p.range + 1)
  if (tile === POWER_SPEED) p.speed = Math.min(MAX_SPEED, p.speed + 1)
  if (isPowerUp(tile)) tiles[y][x] = EMPTY
}

function placeBomb(p, now) {
  const myBombs = bombs.filter((b) => b.owner === p).length
  if (myBombs >= p.maxBombs || bombAt(p.x, p.y)) return
  bombs.push({ x: p.x, y: p.y, owner: p, range: p.range, explodeAt: now + BOMB_TIME })
}

function explode(bomb, now) {
  bombs = bombs.filter((b) => b !== bomb)
  const until = now + FIRE_TIME
  fireUntil[bomb.y][bomb.x] = until

  for (const [dx, dy] of Object.values(DIRECTIONS)) {
    for (let i = 1; i <= bomb.range; i++) {
      const x = bomb.x + dx * i
      const y = bomb.y + dy * i
      if (!inside(x, y) || tiles[y][x] === WALL) break

      const tile = tiles[y][x]
      const alreadyBurning = fireUntil[y][x] > now
      fireUntil[y][x] = until

      if (tile === BLOCK) {
        tiles[y][x] = randomPowerUp() // fire stops at the block
        break
      }
      if (isPowerUp(tile)) {
        // Burn old power ups, but not one that just came out of a block
        if (!alreadyBurning) tiles[y][x] = EMPTY
        break
      }
      const other = bombAt(x, y)
      if (other) {
        other.explodeAt = 0 // chain reaction, it explodes this tick
        break
      }
    }
  }
}

function randomPowerUp() {
  const r = Math.random()
  if (r < 0.1) return POWER_BOMB
  if (r < 0.2) return POWER_FLAME
  if (r < 0.3) return POWER_SPEED
  return EMPTY
}

function applyDamage(now) {
  for (const p of players) {
    if (p.lives <= 0 || now < p.safeUntil || fireUntil[p.y][p.x] <= now) continue
    p.lives--
    p.wantedMove = null
    p.wantsBomb = false
    if (p.lives > 0) {
      // Back to own corner, invincible longer than any fire lasts
      p.x = CORNERS[p.id - 1][0]
      p.y = CORNERS[p.id - 1][1]
      p.safeUntil = now + SAFE_TIME
    }
  }
}

function checkWinner(now) {
  const alive = players.filter((p) => p.lives > 0)
  if (alive.length > 1) return
  phase = 'over'
  overEndsAt = now + OVER_TIME
  broadcast({ type: 'over', winner: alive.length ? alive[0].name : null })
}

// ----- Game loop -----
function update(now) {
  if (phase === 'lobby' && waitEndsAt && now >= waitEndsAt) startCountdown()
  else if (phase === 'countdown' && now >= startsAt) startGame()
  else if (phase === 'over' && now >= overEndsAt) {
    phase = 'lobby'
    checkLobby()
  } else if (phase === 'playing') {
    applyInputs(now)
    let ready
    while ((ready = bombs.find((b) => now >= b.explodeAt))) explode(ready, now)
    applyDamage(now)
    checkWinner(now)
  }
}

function currentMessage(now) {
  if (phase === 'lobby' || phase === 'countdown') {
    return {
      type: 'lobby',
      players: players.map((p) => p.name),
      waitSeconds: waitEndsAt ? Math.max(0, Math.ceil((waitEndsAt - now) / 1000)) : null,
      countdown: phase === 'countdown' ? Math.max(0, Math.ceil((startsAt - now) / 1000)) : null,
    }
  }
  return {
    type: 'state',
    map: buildMatrix(now),
    players: players.map((p) => ({
      id: p.id,
      name: p.name,
      x: p.x,
      y: p.y,
      lives: p.lives,
      bombs: p.maxBombs,
      range: p.range,
      speed: p.speed,
      safe: now < p.safeUntil,
    })),
    // A player standing on a bomb hides it in the map, so bombs are also listed
    bombs: bombs.map((b) => ({ x: b.x, y: b.y })),
  }
}

function tick() {
  const now = Date.now()
  try {
    update(now)
    const text = JSON.stringify(currentMessage(now)) // built once for everyone
    for (const p of players) {
      if (lastSent.get(p.client) === text) continue // nothing changed
      lastSent.set(p.client, text)
      p.client.send(text)
    }
  } catch (err) {
    console.error('tick error:', err) // never crash the server
  }
}

setInterval(tick, TICK)

module.exports = { join, leave, queueMove, chat }
