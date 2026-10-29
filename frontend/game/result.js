import { h } from '../framework/index.js'
import { avatarView } from '../components/character.js'

export function resultView(state, game) {
  const winner = game.players.find(player => player.name === state.winner)
  let title = 'Nobody Survived'
  if (state.winner === state.me) title = 'You Win!'
  else if (state.winner) title = state.winner + ' Wins!'
  return h('div', { class: 'overlay' },
    h('div', { class: 'result', role: 'alert' },
      winner && avatarView(winner.character),
      h('h2', {}, title),
      h('p', { class: 'secondary' }, 'Back to the waiting room in 5 s…'),
    ),
  )
}

