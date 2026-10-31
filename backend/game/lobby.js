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
const { forfeit } = require('./lives')

function waiting() {
  return state.phase === 'lobby' || state.phase === 'countdown'
}

function randomFreeCharacter() {
  const taken = new Set(state.players.map((player) => player.character))
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
  if (state.players.some((player) => player.name.toLowerCase() === name.toLowerCase())) {
    return send(client, { type: 'error', message: 'Nickname taken' })
  }

  // A wanted character is only a wish: it may be taken in the meantime
  const wants = Number.isInteger(character) && character >= 1 && character <= CHARACTERS ? character : null
  if (wants && state.players.some((player) => player.character === wants)) {
    return send(client, { type: 'error', message: 'Character taken, pick another one' })
  }
  const picked = wants || randomFreeCharacter()
  if (!picked) return send(client, { type: 'error', message: 'No character left' })

  state.players.push({
    client, name, character: picked, lives: 0, lastChatAt: 0,
    connected: true, forfeited: false,
  })
  send(client, { type: 'joined', name, character: picked })
  checkLobby()
}

// Change character while waiting. The character stays locked for the others.
function pick(client, character) {
  const player = findPlayer(client)
  if (!player) return send(client, { type: 'error', message: 'Join first' })
  if (!waiting()) return send(client, { type: 'error', message: 'Game already started' })
  if (!Number.isInteger(character) || character < 1 || character > CHARACTERS) return
  if (player.character === character) return
  if (state.players.some((other) => other.character === character)) {
    return send(client, { type: 'error', message: 'Character taken, pick another one' })
  }
  player.character = character
  send(client, { type: 'joined', name: player.name, character })
  broadcastLobby()
}

// Keep the round's result visible, but never keep a disconnected lobby slot.
function leave(client) {
  const player = findPlayer(client)
  if (!player || !player.connected) return
  player.connected = false
  state.lastSent.delete(client)
  if (state.phase === 'playing' || state.phase === 'over') {
    forfeit(player, Date.now())
    return
  }

  state.players = state.players.filter((player) => player.client !== client)
  if (state.phase === 'countdown' && state.players.length < 2) state.phase = 'lobby'
  checkLobby()
}

// Start or stop the timers after a player joins or leaves
function checkLobby() {
  if (state.phase !== 'lobby') return
  state.players = state.players.filter(player => player.connected)
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
  state.players.forEach((player, i) => {
    player.id = i + 1
    player.x = CORNERS[i][0]
    player.y = CORNERS[i][1]
    player.lives = LIVES
    player.forfeited = false
    player.maxBombs = 1
    player.range = 1
    player.speed = 0
    player.totalPups = 0 // total collected power-ups (bombs+flames+speed)
    player.nextMoveAt = 0
    player.safeUntil = 0
    player.heldMove = null
    player.pendingMove = null
    player.wantsBomb = false
  })
}

module.exports = { join, pick, leave, checkLobby, startCountdown, startGame }
