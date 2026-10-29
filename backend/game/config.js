// All the game settings and the symbols used in the map.
// Change a number here to change the game. Times are in milliseconds.

// ----- Settings -----
const WIDTH = 15
const HEIGHT = 13
const LIVES = 3
const MAX_PLAYERS = 4
const TICK = 20 // game loop speed (ms)
const WAIT_TIME = 20000 // wait for more players (ms)
const READY_TIME = 10000 // countdown before start (ms)
const OVER_TIME = 5000 // show winner, then back to lobby (ms)
const BOMB_TIME = 3000 // bomb explodes after (ms)
const FIRE_TIME = 500 // flames stay (ms)
const SAFE_TIME = 2000 // invincible after losing a life (ms)
const MOVE_DELAY = 200 // ms between two moves of a player, speed power ups shorten it
const SPEED_STEP = 30 // each speed power up removes this from MOVE_DELAY
const MAX_BOMBS = 8
const MAX_RANGE = 8
const MAX_SPEED = 4
const MAX_POWERUPS = 5 // total power-ups a player can collect (bombs + flames + speed)
const CHAT_DELAY = 300 // ms between chat messages
const NAME_RULE = /^[\p{L}\p{N} _-]{1,15}$/u
const CHARACTERS = 9 // roster in frontend/data/characters.js, files in frontend/assets

// ----- Map symbols (the map sent to the browsers is a grid of these) -----
const EMPTY = '.'
const WALL = '#' // can not be destroyed
const BLOCK = 'B' // can be destroyed
const BOMB = 'X'
const FIRE = 'F'
const POWER_BOMB = 'b' // +1 bomb at a time
const POWER_FLAME = 'f' // +1 explosion range
const POWER_SPEED = 's' // faster moves
// Players are shown in the map as '1', '2', '3', '4'

// Start corner of players 1 to 4, as [x, y]
const CORNERS = [
  [1, 1],
  [WIDTH - 2, 1],
  [1, HEIGHT - 2],
  [WIDTH - 2, HEIGHT - 2],
]

// The moves a player can ask for, as [dx, dy]
const DIRECTIONS = {
  up: [0, -1],
  down: [0, 1],
  left: [-1, 0],
  right: [1, 0],
}

module.exports = {
  WIDTH, HEIGHT, LIVES, MAX_PLAYERS, TICK, WAIT_TIME, READY_TIME, OVER_TIME,
  BOMB_TIME, FIRE_TIME, SAFE_TIME, MOVE_DELAY, SPEED_STEP, MAX_BOMBS, MAX_RANGE,
  MAX_SPEED, MAX_POWERUPS, CHAT_DELAY, NAME_RULE, CHARACTERS,
  EMPTY, WALL, BLOCK, BOMB, FIRE, POWER_BOMB, POWER_FLAME, POWER_SPEED,
  CORNERS, DIRECTIONS,
}
