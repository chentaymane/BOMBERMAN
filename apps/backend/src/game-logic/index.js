// The transport calls these commands. Importing them starts no timers;
// server.js owns startup and the simulation loop owns all movement updates.
const { join, pick, leave } = require('./lobby')
const { queueMove } = require('./moves')
const { queuePlace } = require('./bombs')
const { chat } = require('./chat')

module.exports = { join, pick, leave, queueMove, queuePlace, chat }
