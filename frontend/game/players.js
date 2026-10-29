import { h } from '../framework/index.js'
import { characterStyle } from '../components/character.js'

// Last drawn position of each player, to spot a respawn (a jump of more than one cell)
const lastPositions = {}

// The server sends the movement duration so animation and game rules agree.
export function playerView(player, me) {
  const prev = lastPositions[player.id]
  const respawn = prev && Math.abs(prev.x - player.x) + Math.abs(prev.y - player.y) > 1
  lastPositions[player.id] = { x: player.x, y: player.y }
  return h('div', {
    key: player.id,
    class: `player c${player.character}${player.safe ? ' safe' : ''}${player.name === me ? ' me' : ''}`,
    style: {
      ...characterStyle(player.character),
      transform: `translate(calc(${player.x} * var(--cell)), calc(${player.y} * var(--cell)))`,
      transitionDuration: respawn ? '0ms' : player.moveDelay + 'ms', // no slide back to the corner
    },
  }, h('span', { class: 'tag' }, player.name))
}

