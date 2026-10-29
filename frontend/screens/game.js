import { h } from '../framework/index.js'
import { tilesView } from '../game/tiles.js'
import { playerView } from '../game/players.js'
import { chipView, controlsHint } from '../game/hud.js'
import { resultView } from '../game/result.js'
import { toggleSound } from '../game/sounds.js'

export function gameView(state) {
  const game = state.game
  const me = game.players.find(player => player.name === state.me)
  const alive = game.players.filter(player => player.lives > 0)
  return h('div', {
    class: 'game',
    style: { '--columns': game.map[0].length, '--rows': game.map.length },
  },
    h('ul', { class: 'chips' }, game.players.map(player => chipView(player, state.me))),
    h('div', { class: 'board' },
      tilesView(game),
      h('div', { class: 'players', 'aria-hidden': 'true' },
        alive.map(player => playerView(player, state.me)),
      ),
      me && me.lives === 0 && !state.over
        && h('div', { class: 'banner' }, "You're out! Watching…"),
      state.over && resultView(state, game),
    ),
    h('div', { class: 'game-footer' },
      controlsHint,
      h('button', {
        type: 'button', class: 'sound-toggle', onClick: toggleSound,
        'aria-label': 'Game sound', 'aria-pressed': state.soundEnabled ? 'true' : 'false',
      }, state.soundEnabled ? 'Sound: on' : 'Sound: off'),
      h('span', { class: 'fps', title: 'Frames per second' }, state.fps + ' FPS'),
    ),
  )
}
