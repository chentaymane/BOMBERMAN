// The game, as the rest of the server sees it (sockets.js calls these functions).
//
// The server is the only source of truth. Players only say what they WANT to
// do; the wish is stored and then checked against the real map in the game loop.
//
// Files in this folder:
//   config.js    all settings and map symbols
//   state.js     everything the game remembers (one shared object)
//   helpers.js   small functions used by several files
//   map.js       the random map and the grid sent to the browsers
//   messages.js  the 'lobby' and 'state' messages
//   lobby.js     join, pick a character, leave, and the timers that start a game
//   moves.js     player wishes, moving, picking up power-ups
//   bombs.js     dropping bombs and explosions
//   lives.js     damage and the winner
//   chat.js      chat messages
//   loop.js      the game loop (every 20 ms)
const { join, pick, leave } = require('./lobby')
const { queueMove } = require('./moves')
const { chat } = require('./chat')
const { startLoop } = require('./loop')

startLoop()

module.exports = { join, pick, leave, queueMove, chat }
