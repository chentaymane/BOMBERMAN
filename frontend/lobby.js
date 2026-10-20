import { h } from './framework/index.js'

export function lobbyView(s) {
  const { players, waitSeconds, countdown } = s.lobby

  let info = 'Waiting for at least 2 players...'
  if (countdown != null) info = `Game starts in ${countdown}s`
  else if (waitSeconds != null) info = `Waiting for more players: ${waitSeconds}s`

  return h('div', { class: 'card' },
    h('h1', {}, 'Waiting room'),
    h('p', { class: 'counter' }, `${players.length} / 4`),
    h('ul', { class: 'list' }, players.map((name) => h('li', { key: name }, name === s.me ? name + ' (you)' : name))),
    h('p', {}, info),
  )
}
