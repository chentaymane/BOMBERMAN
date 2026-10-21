// Everything the game remembers, in one object shared by all the game files.
// The files change it in place (for example state.players = ...), so they
// always see the same data. Nothing else keeps game data.

module.exports = {
  phase: 'lobby', // 'lobby' | 'countdown' | 'playing' | 'over'
  players: [], // { client, name, character, id, x, y, lives, ... }
  tiles: [], // tiles[y][x] = EMPTY | WALL | BLOCK | power up
  fireUntil: [], // fireUntil[y][x] = time the fire on this cell ends
  bombs: [], // { x, y, owner, range, explodeAt }
  waitEndsAt: 0, // end of the 20 s wait for more players (0 = not running)
  startsAt: 0, // end of the 10 s countdown
  overEndsAt: 0, // end of the 5 s winner screen
  lastSent: new Map(), // client -> last message, to send only changes
}
