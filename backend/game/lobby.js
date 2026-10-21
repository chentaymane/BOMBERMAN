// The waiting room: joining with a nickname, picking a character, leaving,
// and the timers that start the game:
//   2 players in        -> a 20 s wait for more players starts
//   wait over, or 4 in  -> a 10 s countdown starts
//   countdown over      -> the game starts (startGame, called by the loop)
const { MAX_PLAYERS, CHARACTERS, NAME_RULE, WAIT_TIME, READY_TIME, LIVES, CORNERS } = require('./config')
const state = require('./state')
const { send, findPlayer, cleanText } = require('./helpers')
const { createMap } = require('./map')
const { broadcastLobby } = require('./messages')

function waiting() {
  return state.phase === 'lobby' || state.phase === 'countdown'
}

function randomFreeCharacter() {
  const taken = new Set(state.players.map((p) => p.character))
  const free = []
  for (let c = 1; c <= CHARACTERS; c++) if (!taken.has(c)) free.push(c)
  return free.length ? free[Math.floor(Math.random() * free.length)] : null
}

// join(client, name, character): character is optional (0, null, undefined or a
// string also mean "no choice"), then a random free one is assigned
function join(client, name, character) {
  if (findPlayer(client)) return
  if (typeof name !== 'string') return send(client, { type: 'error', message: 'Nickname required' })
  name = cleanText(name, 100) // too long names fail NAME_RULE below
  if (!NAME_RULE.test(name)) {
    return send(client, { type: 'error', message: 'Nickname: 1-15 letters, numbers, space, _ or -' })
  }
  if (!waiting()) return send(client, { type: 'error', message: 'Game already started' })
  if (state.players.length >= MAX_PLAYERS) return send(client, { type: 'error', message: 'Game is full' })
  if (state.players.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
    return send(client, { type: 'error', message: 'Nickname taken' })
  }

  // A wanted character is only a wish: it may be taken in the meantime
  const wants = Number.isInteger(character) && character >= 1 && character <= CHARACTERS ? character : null
  if (wants && state.players.some((p) => p.character === wants)) {
    return send(client, { type: 'error', message: 'Character taken, pick another one' })
  }
  const picked = wants || randomFreeCharacter()
  if (!picked) return send(client, { type: 'error', message: 'No character left' })

  state.players.push({ client, name, character: picked, lives: 0, lastChatAt: 0 })
  send(client, { type: 'joined', name, character: picked })
  checkLobby()
}

// Change character while waiting. The character stays locked for the others.
function pick(client, character) {
  const p = findPlayer(client)
  if (!p) return send(client, { type: 'error', message: 'Join first' })
  if (!waiting()) return send(client, { type: 'error', message: 'Game already started' })
  if (!Number.isInteger(character) || character < 1 || character > CHARACTERS) return
  if (p.character === character) return
  if (state.players.some((other) => other.character === character)) {
    return send(client, { type: 'error', message: 'Character taken, pick another one' })
  }
  p.character = character
  send(client, { type: 'joined', name: p.name, character })
  broadcastLobby()
}

// A connection closed: the player is removed, in the lobby or during a game
function leave(client) {
  state.players = state.players.filter((p) => p.client !== client)
  state.lastSent.delete(client)
  if (state.phase === 'countdown' && state.players.length < 2) state.phase = 'lobby'
  checkLobby()
  // During a game, the loop sees the missing player and checks for a winner
}

// Start or stop the timers after a player joins or leaves
function checkLobby() {
  if (state.phase !== 'lobby') return
  if (state.players.length === MAX_PLAYERS) startCountdown()
  else if (state.players.length < 2) state.waitEndsAt = 0
  else if (!state.waitEndsAt) state.waitEndsAt = Date.now() + WAIT_TIME
}

function startCountdown() {
  state.phase = 'countdown'
  state.waitEndsAt = 0
  state.startsAt = Date.now() + READY_TIME
}

// New map, every player in their corner with 3 lives and no power-ups
function startGame() {
  state.phase = 'playing'
  createMap()
  state.bombs = []
  state.players.forEach((p, i) => {
    p.id = i + 1
    p.x = CORNERS[i][0]
    p.y = CORNERS[i][1]
    p.lives = LIVES
    p.maxBombs = 1
    p.range = 1
    p.speed = 0
    p.totalPups = 0 // total collected power-ups (bombs+flames+speed)
    p.nextMoveAt = 0
    p.safeUntil = 0
    p.wantedMove = null
    p.wantsBomb = false
  })
}

module.exports = { join, pick, leave, checkLobby, startCountdown, startGame }
