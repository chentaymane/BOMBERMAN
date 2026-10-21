// Chat: every player who joined can talk to everybody, in the waiting room
// and during a game. The text is cleaned and limited to 200 characters.
const { CHAT_DELAY } = require('./config')
const { findPlayer, broadcast, cleanText } = require('./helpers')

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

module.exports = { chat }
