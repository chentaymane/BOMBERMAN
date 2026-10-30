// The two messages the loop sends to every player:
//   'lobby' while players wait (names, characters, timers)
//   'state' during a game (map, players, bombs)
// All fields are explained in backend/API.md.
const state = require('./state')
const { buildMatrix } = require('./map')
const { getMoveDelay, broadcast } = require('./helpers')
const { MAX_PLAYERS, WAIT_TIME, READY_TIME } = require('./config')

function currentMessage(now) {
  const { phase, players, waitEndsAt, startsAt } = state
  if (phase === 'lobby' || phase === 'countdown') {
    return {
      type: 'lobby',
      maxPlayers: MAX_PLAYERS,
      waitDuration: WAIT_TIME / 1000,
      readyDuration: READY_TIME / 1000,
      players: players.map((player) => ({ name: player.name, character: player.character })),
      // Characters already locked by a player, so the waiting room can grey them out
      taken: players.map((player) => player.character),
      waitSeconds: waitEndsAt ? Math.max(0, Math.ceil((waitEndsAt - now) / 1000)) : null,
      countdown: phase === 'countdown' ? Math.max(0, Math.ceil((startsAt - now) / 1000)) : null,
    }
  }
  return {
    type: 'state',
    map: buildMatrix(now),
    players: players.map((player) => ({
      id: player.id,
      name: player.name,
      character: player.character,
      x: player.x,
      y: player.y,
      lives: player.lives,
      forfeited: player.forfeited,
      bombs: player.maxBombs,
      range: player.range,
      speed: player.speed,
      moveDelay: getMoveDelay(player),
      safe: now < player.safeUntil,
    })),
    // A player standing on a bomb hides it in the map, so bombs are also listed
    bombs: state.bombs.map((b) => ({ x: b.x, y: b.y })),
  }
}

// Send the lobby message right away (a pick must be seen before the next tick)
function broadcastLobby() {
  broadcast(currentMessage(Date.now()), { deduplicate: true })
}

module.exports = { currentMessage, broadcastLobby }
