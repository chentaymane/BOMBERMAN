// The two messages the loop sends to every player:
//   'lobby' while players wait (names, characters, timers)
//   'state' during a game (map, players, bombs)
// All fields are explained in backend/API.md.
const state = require('./state')
const { buildMatrix } = require('./map')

function currentMessage(now) {
  const { phase, players, waitEndsAt, startsAt } = state
  if (phase === 'lobby' || phase === 'countdown') {
    return {
      type: 'lobby',
      players: players.map((p) => ({ name: p.name, character: p.character })),
      // Characters already locked by a player, so the waiting room can grey them out
      taken: players.map((p) => p.character),
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
      character: p.character,
      x: p.x,
      y: p.y,
      lives: p.lives,
      bombs: p.maxBombs,
      range: p.range,
      speed: p.speed,
      safe: now < p.safeUntil,
    })),
    // A player standing on a bomb hides it in the map, so bombs are also listed
    bombs: state.bombs.map((b) => ({ x: b.x, y: b.y })),
  }
}

// Send the lobby message right away (a pick must be seen before the next tick)
function broadcastLobby() {
  const text = JSON.stringify(currentMessage(Date.now()))
  for (const p of state.players) {
    state.lastSent.set(p.client, text)
    p.client.send(text)
  }
}

module.exports = { currentMessage, broadcastLobby }
