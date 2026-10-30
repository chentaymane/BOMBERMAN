# Bomberman DOM Multiplayer — Full Code Audit

**Audited repository:** `/home/ouaaitalla/BOMBERMAN` (branch `ref`, commit `6d3a4bf`)
**Audit date:** 2026-10-29
**Auditor:** static analysis + dependency-free execution harnesses (see §10)
**Application source modified during the audit:** none (`git status --porcelain` empty before and after)
**Dependencies installed during the audit:** none (user declined installation; `backend/node_modules` is absent)

---

## 1. Executive summary

### Overall status

The project is a **coherent, server-authoritative Bomberman implementation** that genuinely uses the custom
mini-framework, contains no Canvas/WebGL/third-party UI framework, and implements the mandatory gameplay
rules (2–4 players, 3 lives, corners, walls/blocks, bombs, flames, three power-ups, server-side chat,
lobby timers). The core game logic is in good shape: **all 118 logic checks and 23 framework checks
executed during this audit passed**, and the HTTP layer resisted path-traversal attempts.

It is **not yet ready for evaluation as-is**, for three reasons:

1. **The 60 FPS requirement has no evidence whatsoever.** There is no committed benchmark, no
   performance report (`PERFORMANCE.md` is linked from the README but missing), and the in-game FPS
   counter is a single 1-second average. Runtime performance could not be measured in this
   environment (see §13), so the requirement remains **NOT VERIFIED**.
2. **`npm test` is broken**: `backend/package.json` points to four test files in a `tests/` directory
   that does not exist (exit code 1, reproduced).
3. **Map generation produces ~24.6 % walkable floor with a median connected region of 1 cell**;
   in 2000 generated maps, the four corners were mutually reachable **0.0 %** of the time. Spawn
   escapes are safe, but every match is a digging exercise rather than a Bomberman arena.

### Estimated mandatory completion

Counting every row of the mandatory table in §3 (87 requirements):

| Status | Count |
| --- | --- |
| **PASS** | 73 |
| **PARTIAL** | 7 |
| **FAIL** | 1 |
| **NOT VERIFIED** | 6 |
| Total | 87 |

* Completion (PASS = 1, PARTIAL = 0.5, FAIL = 0, NOT VERIFIED = 0):
  `(73 + 3.5) / 87 = 87.9 %`
* Completion excluding rows that could not be executed (denominator 81):
  `(73 + 3.5) / 81 = 94.4 %`

Unverified requirements are **not** counted as passed. The 6 unverified rows are concentrated in the
two areas that need a browser and the `ws` dependency: explosion visuals and end-to-end WebSocket/FPS
behaviour.

### Most important defects

| # | Severity | Defect |
| --- | --- | --- |
| BUG-01 | MEDIUM | Maps are generated at 70 % block density; median connected floor region is 1 cell, corners never connected (measured, §7/§8) |
| BUG-02 | MEDIUM | A collected power-up beyond the fifth is silently destroyed with no effect (`MAX_POWERUPS`, verified) |
| BUG-03 | MEDIUM | `broadcast()` and `send()` have no per-socket guard; one failing socket can abort a whole tick's broadcast |
| BUG-04 | MEDIUM | The mandatory 60 FPS requirement has no measurement or committed evidence |
| BUG-05 | MEDIUM | The declared test suite does not exist; `npm test` exits 1 |
| BUG-06 | LOW | Disconnect always dumps the player to the login screen; no reconnection, no resume |
| BUG-07 | LOW | Connection cap is off by one (51 connections accepted) |
| BUG-08 | LOW | 792-line `frontend/style.css` is dead code, not referenced by `index.html` |
| BUG-09 | LOW | Documented files missing: `ARCHITECTURE.md`, `PERFORMANCE.md`, `frontend/allal/`; no MP3 assets, so the sound feature is always silent |

**Verdict:** the mechanics are close to submission quality; the *evidence and documentation* around them
are not. Fix BUG-01, BUG-05, BUG-06 and add a real FPS benchmark before evaluation.

---

## 2. Project architecture

### Repository structure (64 tracked files, ~3,400 LOC)

```text
README.md                      project + rules + architecture notes
backend/
  server.js                    entry point: HTTP + WebSocket + simulation loop
  package.json                 only dependency: ws; scripts (test/perf) are broken
  API.md                       WebSocket protocol contract (accurate, see §8)
  transport/http.js            static file server (allow-list of extensions)
  transport/websocket.js       ws server, rate limits, heartbeat, message dispatch
  game/config.js               all constants (map size, timings, symbols, corners)
  game/state.js                single mutable game-state object
  game/lobby.js                join/pick/leave + lobby timers + startGame
  game/map.js                  map generation + client matrix builder
  game/moves.js                queued directions, collision, power-up pickup
  game/bombs.js                placement, explosion, drop table
  game/lives.js                damage, respawn, winner, forfeit
  game/messages.js             lobby/state message construction
  game/chat.js                 chat validation + broadcast
  game/helpers.js              send/broadcast/findPlayer/inside/bombAt/cleanText
  game/loop.js                 20 ms fixed tick, ordered update, deduplicated broadcast
frontend/
  index.html                   shell, 6 stylesheets, one ES module entry
  app.js                       mount, controls, sounds, socket, requestAnimationFrame loop
  store.js                     batched application store
  socket.js                    server message → store mapping
  framework/                   the custom mini-framework (+ extensions)
  views/                       login, lobby, game, chat
  game/                        controls, tile diffing, media loading/playback
  data/characters.js           9-character roster (single source of URLs)
  styles/                      6 purpose-scoped stylesheets
  style.css                    DEAD: 792 lines, superseded by styles/, not linked
  assets/                      9 character webp images, 4 SVG textures, no MP3
```

### Main entry points

| Layer | Entry | Notes |
| --- | --- | --- |
| Server | `backend/server.js:8-11` | `http.createServer(serveFile)`, `startSockets(server)`, `startLoop()`, listen on `PORT` (8080) |
| Client | `frontend/index.html:21` → `frontend/app.js` | mounts `appView`, starts controls/audio/socket, one `requestAnimationFrame` loop |
| Transport contract | `backend/API.md` | 5 client message types, 5 server message types |

### Framework integration

The custom framework is **actually used**, not merely present:

* `frontend/app.js:1` imports `h, mount`; `:16` calls `mount(appView, '#app', store)`.
* `frontend/views/*.js` build every screen with `h()`; no markup strings, no `innerHTML`.
* `frontend/framework/dom.js` provides `h`, `createElement`, `patch` (keyed diff), `mount`.
* `framework/events.js` installs one real listener per event type and swaps handlers on re-render
  (`el._events`), preventing duplicate listeners.
* `framework/batched-state.js` wraps `framework/state.js` so several network messages produce one
  render per animation frame.
* `framework/websocket.js`, `images.js`, `audio.js` are reusable extensions documented in
  `framework/EXTENSIONS.md`.
* `framework/router.js` is exported by `index.js` but **never imported** by the application (dead code).

### Frontend/backend boundary

The server owns all game state. The client sends only **intents** (`join`, `pick`, `move` with a
direction, `place`, `chat`) and renders snapshots. `frontend/game/tiles.js` and `frontend/views/game.js`
never mutate gameplay state; player positions come from the server (`moveDelay` is used only as a CSS
transition duration).

### Game loop and rendering architecture

* **Server:** `setInterval(tick, 20)` (`loop.js:39-42`). One tick applies, in order:
  placements → movement → explosions → damage → winner check (`loop.js:19-27`), then broadcasts the
  current message with per-client JSON deduplication.
* **Client:** one `requestAnimationFrame` loop (`app.js:41`) that (a) repeats held movement input,
  (b) counts FPS, (c) flushes the batched store exactly once per frame.
* **Rendering:** virtual DOM diff. Tiles are cached by visual class (`tiles.js:39-64`), players are
  translated with CSS transforms, chat is a keyed list capped at 50 messages.

### WebSocket architecture

Single endpoint on the same port as HTTP (`transport/websocket.js:57`). Incoming JSON is size-limited
(4 KB), rate-limited (60 msg/s processed, 200 msg/s disconnects), parsed defensively, and dispatched to
`game/index.js`. The server sends `lobby` / `state` / `chat` / `over` / `joined` / `error`. Heartbeat
pings every 15 s remove silently dead TCP connections.

### Important dependencies

* Backend: `ws@^8.22.0` only (`backend/package.json:14-16`). No framework, DB, or auth dependencies.
* Frontend: **none**. Google Fonts is the only external request (`index.html:11`), with a documented
  system-font fallback.
* No build step; browser-native ES modules are served directly (`.js` → `text/javascript`).

---

## 3. Mandatory requirements audit

Status values: **PASS** = executed/verified; **PARTIAL** = implemented but incomplete/incorrect in some
case; **FAIL** = violates or lacks a mandatory requirement; **NOT VERIFIED** = insufficient evidence.

### A. Framework and rendering restrictions

| ID | Requirement | Status | Evidence | Problem | Recommended fix |
| --- | --- | --- | --- | --- | --- |
| A1 | Own mini-framework used for the game UI | PASS | `app.js:1,16`; `framework/dom.js:121-158`; 23/23 framework checks executed | none | — |
| A2 | No Canvas | PASS | grep for `canvas`/`getContext` in `frontend/` returns nothing | none | — |
| A3 | No WebGL | PASS | grep for `webgl`/`three` returns nothing | none | — |
| A4 | No other frontend framework | PASS | `index.html:12-21` loads only own modules; `backend/package.json` has only `ws` | none | — |
| A5 | Framework rendering/DOM updates suitable for a game | PASS | keyed diff test; measured 0.103 ms avg render+patch per snapshot (§7) | none | — |
| A6 | Event handling suitable | PASS | `framework/events.js:3-11`; checks F11–F13 (one listener, handler swap, removal) | none | — |
| A7 | Lifecycle mechanisms appropriate | PARTIAL | `mount` subscribes once (`dom.js:152`); `startControls`/`startSounds` return cleanups that `app.js:17-18` ignores | no teardown path; acceptable for a single-page game but unused API | use the returned unsubscribers or document the single-mount assumption |

### B. Game objective and player management

| ID | Requirement | Status | Evidence | Problem | Recommended fix |
| --- | --- | --- | --- | --- | --- |
| B1 | 2 to 4 human players | PASS | `config.js:5-7`; join gating `lobby.js:29-48`; harness T2/T4 | none | — |
| B2 | Play until one player remains | PASS | `lives.js:23-31`; check L12 (last survivor wins) | none | — |
| B3 | Each player starts with 3 lives | PASS | `config.js:6`; `lobby.js:104`; check T1.9 | none | — |
| B4 | Eliminated at 0 lives | PASS | `moves.js:12-16`, `bombs.js:21-25` reject dead players; check L6 | none | — |
| B5 | Distinct corner starts | PASS | `config.js:35-40`; checks T1.10, T2.5 (4 distinct corners) | none | — |
| B6 | Player identity and nickname handling | PASS | `lobby.js:29-62`; checks T5.1–T5.7 (trim, length, charset, uniqueness, case-insensitive) | none | — |
| B7 | No multiple winners / defined no-winner behaviour | PASS | single `alive[0]`; draw → `winner:null` (`lives.js:29`); checks L4–L6 | a round can legitimately end with 0 survivors (spec ambiguity, see §3.1) | document the draw rule or add a tie-break |

### C. Lobby and matchmaking

| ID | Requirement | Status | Evidence | Problem | Recommended fix |
| --- | --- | --- | --- | --- | --- |
| C1 | Nickname required before entering | PASS | `views/login.js:7-15`; server rejects non-joined clients (`chat.js`, `moves.js`) | none | — |
| C2 | Waiting page after a valid nickname | PASS | `views/lobby.js`; `socket.js:13-19` switches to `lobby` on `joined` | none | — |
| C3 | Player counter updates live | PASS | `messages.js:18` (`players`); counter in `views/lobby.js:43`; check T1.4 | counter is derived client-side from the array length | — |
| C4 | Counter never exceeds 4 | PASS | `lobby.js:35`; check T4.1 (6 join attempts → 4 players) | none | — |
| C5 | 2–3 players: 20 s wait, then 10 s countdown | PASS | `lobby.js:87-99`; checks T1.1–T1.8, T3.1–T3.3 (exact 20 000 ms / 10 000 ms boundaries) | none | — |
| C6 | 4 players: countdown starts immediately | PASS | `lobby.js:90`; checks T2.1–T2.4 | none | — |
| C7 | Game starts when the countdown finishes | PASS | `loop.js:19-20`; checks T1.8, T2.4 | none | — |
| C8 | One authoritative timer for all clients | PASS | timers live only in server state (`state.js:11-13`), messages carry `waitSeconds`/`countdown`; no client-side timers | none | — |
| C9 | Duplicate nicknames refused | PASS | `lobby.js:36-38` (lower-cased compare); check T5.1 | Unicode homoglyphs can look identical (theoretical) | optionally normalize/confusable-check |
| C10 | Joining a full lobby refused | PASS | `lobby.js:35`; checks T4.2–T4.3 (`Game is full`) | none | — |
| C11 | Disconnect during wait/countdown | PASS | `lobby.js:75-85`; check L8 plus harness countdown-drop scenario | a 4→2 drop keeps the original countdown (reasonable) | document the rule |
| C12 | Character selection is locked consistently (extra feature) | PASS | `lobby.js:64-73`; checks T7.1–T7.3 | `pick` with a non-integer returns silently (no error message) | send an `error` for invalid characters |

### D. Map generation

| ID | Requirement | Status | Evidence | Problem | Recommended fix |
| --- | --- | --- | --- | --- | --- |
| D1 | Whole map visible to every player | PASS | `messages.js:33-34` sends the full 13×15 matrix; check S3 | none | — |
| D2 | Indestructible walls at predefined positions | PASS | `map.js:18-22` (border + even/even pillars); checks M1, M2 over 300 maps | none | — |
| D3 | Destructible blocks generated randomly | PASS | `map.js:22` (`Math.random() < 0.7`); check M5 (~91 blocks/map) | density is very high (D8) | lower to ~0.45–0.55 |
| D4 | Identical layout for all players | PASS | one server-side `state.tiles` serialized to everyone; check S3 | none | — |
| D5 | Starting areas allow escaping your own bomb | PASS | `map.js:7-11` clears manhattan ≤ 2; checks M3, M4, M6 (1200 corners) | after flame upgrades the refuge must be at distance ≥ 3 (see BUG-01) | carve a 3-cell L corridor per corner |
| D6 | Collision agrees with the generated map | PASS | `moves.js:37-39` uses `state.tiles`; checks V2–V4, B13 | none | — |
| D7 | No invalid spawns or overlapping entities | PASS | `startGame` resets positions to corners (`lobby.js:103-108`); check M3 | players may overlap each other (no player-player collision) | optional: block movement onto an occupied cell |
| D8 | No unreachable areas / fair starting conditions | PARTIAL | 2 000 generated maps: 24.6 % floor, median connected region **1 cell**, all 4 corners connected **0.0 %**, largest region 26 cells | board is a field of isolated pockets; matches become block-digging, not Bomberman | lower density and carve guaranteed corridors/ring |

### E. Player movement and collisions

| ID | Requirement | Status | Evidence | Problem | Recommended fix |
| --- | --- | --- | --- | --- | --- |
| E1 | Movement and input handling | PASS | `controls.js:22-53`; `moves.js:12-16`; check V5 | none | — |
| E2 | Walls, blocks, bombs and boundaries block movement | PASS | `moves.js:35-39`; checks V1–V4 | none | — |
| E3 | Speed consistent across devices/frame rates | PASS | cooldown uses server `Date.now()` (`moves.js:45`); checks V6, V10 (200 ms → 110 ms at speed 3) | none | — |
| E4 | Corners, bomb placement, respawn, simultaneous movement | PASS | respawn `lives.js:14-19` (check L14); moves applied sequentially by the single tick | two players can occupy one cell | optional player collision |
| E5 | Client cannot spoof position | PASS | protocol accepts a direction only (`API.md`); `queueMove` ignores unknown fields | none | — |

### F. Bombs and explosions

| ID | Requirement | Status | Evidence | Problem | Recommended fix |
| --- | --- | --- | --- | --- | --- |
| F1 | Bomb placement | PASS | `bombs.js:20-35`; check B1 | none | — |
| F2 | Bomb limit per player | PASS | `bombs.js:33`; check B2 | none | — |
| F3 | Bomb timer | PASS | `config.js:12` (3 000 ms); checks B3–B5 | none | — |
| F4 | Explosion range follows flame power | PASS | `bombs.js:45-72`; checks B8, B11–B13 (range 1/2/5) | none | — |
| F5 | Explosion visuals | NOT VERIFIED | CSS only (`styles/game.css:81-110`), no browser run | could not render the game (no `ws` install permission) | check `.fire.h/.v/.c` in a browser |
| F6 | Interactions with walls, blocks, bombs, players | PASS | checks B7–B16, L1–L3 | none | — |
| F7 | Chain reactions (not supported by design) | PASS | `bombs.js:54-58` stops at bombs without detonating; checks B15–B16; documented in README | differs from classic Bomberman | keep, or add if desired |
| F8 | No repeated damage from one explosion | PASS | invincibility window `lives.js:15-20`; checks L1–L3 (one life per explosion), L16 | none | — |
| F9 | Bomb/explosion state synchronized | PASS | `messages.js:45` bomb list + fire in map; checks S1, S2, S7, S8 | none | — |

### G. Power-ups

| ID | Requirement | Status | Evidence | Problem | Recommended fix |
| --- | --- | --- | --- | --- | --- |
| G1 | Random, optional power-up spawn on block destruction | PASS | `bombs.js:75-80`; check B17 over 4 000 samples: 10 % bombs / 10 % flames / 10 % speed / 70 % nothing | none | — |
| G2 | At most one power-up per destroyed block | PASS | the block cell becomes exactly one symbol; check B18 | none | — |
| G3 | Pickup detection | PASS | `moves.js:42-50`; checks V11–V12 | none | — |
| G4 | Bombs power-up effect | PASS | check V11 (`maxBombs` 1 → 2, applied once) | none | — |
| G5 | Flames power-up effect | PASS | check V13 (`range` 1 → 2) | none | — |
| G6 | Speed power-up effect | PASS | check V14 (`speed` 0 → 4 capped, delay 200 → 80 ms) | none | — |
| G7 | Upgrades never applied twice | PASS | single pickup per move, tile cleared first (`moves.js:43-44`) | none | — |
| G8 | Power-up state synchronized | PASS | `messages.js:38-43` (`bombs`, `range`, `speed`); check S4 | none | — |
| G9 | Power-ups survive player death | PASS | only lives/position reset in `lives.js:7-21` | not specified; a design choice (classic Bomberman drops them) | document it |
| G10 | A collected power-up always has an effect | FAIL | `config.js:21` + `moves.js:40-51`; check V15: 6th pickup is deleted with `maxBombs` unchanged | silent loss of a collected item; players cannot know the cap | remove the cap, or keep the item on the floor / display a capped counter |

### H. Chat and WebSockets

| ID | Requirement | Status | Evidence | Problem | Recommended fix |
| --- | --- | --- | --- | --- | --- |
| H1 | Chat exists and is usable in lobby and match | PASS | `views/chat.js`; `chat.js:5-16`; checks C1, C8, C9 | none | — |
| H2 | WebSockets used for chat (not polling) | PASS | `framework/websocket.js`, `transport/websocket.js:44-84`; chat sent through the same socket | none | — |
| H3 | End-to-end connect/send/receive actually executed | NOT VERIFIED | requires `ws` (not installed, install permission declined) | no live socket test | run two tabs and verify §13 steps |
| H4 | Nickname attribution set by the server | PASS | `chat.js:15` uses the server-side player name; checks C1–C2 | none | — |
| H5 | Malformed messages handled | PASS | `transport/websocket.js:30-38` (JSON try/catch, type guards); check C5 | none | — |
| H6 | Message validation and rate limits | PASS | chat 200 chars / 300 ms (`chat.js:9-13`); checks C3–C4, C7; socket caps 4 KB / 60 msg/s | none | — |
| H7 | Disconnection handling | PASS | `lobby.js:75-85`, `lives.js:32-40`; checks L10–L13 | no reconnect (documented) | — |
| H8 | Game state synchronized over the socket | PASS | `messages.js:8-46`; checks S1–S8 (idle dedup, change propagation, map precedence) | transport itself NOT VERIFIED | — |
| H9 | No impersonation or unauthorized actions | PASS | commands bound to the socket (`findPlayer(client)`); `chat` `from` never comes from the client | none | — |
| H10 | No duplicate events/races | PASS | single-threaded tick owns all mutation (`loop.js:16-30`); dedup check S1 | none | — |
| H11 | DoS limits and resource exhaustion | PARTIAL | caps at `transport/websocket.js:7-11`; BUG-07 off-by-one; no per-IP limit, no tests | limits are untested | fix the off-by-one and add a test |
| H12 | Stale connections removed | NOT VERIFIED | heartbeat `transport/websocket.js:60-72` reviewed, not executed | needs a real socket | test with a paused TCP peer |

### I. Performance

| ID | Requirement | Status | Evidence | Problem | Recommended fix |
| --- | --- | --- | --- | --- | --- |
| I1 | `requestAnimationFrame` used correctly | PASS | `app.js:24-41`; single loop, timestamps used for input repeat and FPS | none | — |
| I2 | Animation loop cannot start twice | PASS | module-level single call (`app.js:41`); no re-entry path | none | — |
| I3 | Loop cannot leak or keep running after the game ends | PASS | one loop for the page lifetime, no per-match loop | none | — |
| I4 | No unnecessary DOM rebuilds per frame | PASS | `tiles.js:14-64` caches by class; `h(...)` count measured; check S1 | none | — |
| I5 | No layout thrashing / forced reflows | NOT VERIFIED | transforms + CSS variables only (static review); no browser profile | needs DevTools performance trace | profile a 4-player match |
| I6 | Updates batched per frame | PASS | `batched-state.js:5-28`; checks F17–F20 (3 changes → 1 render) | none | — |
| I7 | Timers, listeners, sockets, entities cleaned up | PARTIAL | no per-round listeners/timers are created (good), but `app.js:17-18` discards the cleanup functions and `lastSent` is pruned on leave | cleanup APIs exist but are unused | store and call them on unload |
| I8 | Mechanics independent of frame count | PASS | all gameplay timing is server-side ms (`loop.js`, `moves.js`) | none | — |
| I9 | FPS measurement exists and is meaningful | PARTIAL | `app.js:24-40` counts rAF callbacks in a 1 s window and displays it (`views/game.js:101`) | single average; no min/p95; hidden tab reports 0 | add min/p95 and a rolling window |
| I10 | 60 FPS requirement evidenced | NOT VERIFIED | no benchmark artifacts; `PERFORMANCE.md` missing | mandatory requirement unproven | commit a measured report |
| I11 | Realistic 4-player benchmark | NOT VERIFIED | scripts `perf:server`/`perf:browser` reference missing files | no coverage of bombs+effects | add a scripted 4-client match benchmark |

### J. Game states and user interface

| ID | Requirement | Status | Evidence | Problem | Recommended fix |
| --- | --- | --- | --- | --- | --- |
| J1 | Full journey login → lobby → game → over → lobby | PARTIAL | server side verified (checks T1–T3, L8); client transitions reviewed in `socket.js:10-49` but never executed | no browser run; missing MP3s make sound states inert | execute the flow in two browser tabs |
| J2 | Winner and game-over state | PASS | `views/game.js:61-87`; checks L4–L6, L12; draw shows “Nobody Survived” | overlay disappears after 5 s (server-driven) | — |
| J3 | Return to lobby / next match | PASS | `loop.js:21-24`, `lobby.js:87-93`; check L8 | with 4 connected players the next countdown starts immediately (no 20 s wait) | document |
| J4 | No stuck states | PARTIAL | all server phases have a timer; client drops to login on close (`socket.js:51-58`) | a transient disconnect ends the player’s match with no way back | add a reconnect grace period |
| J5 | Consistent player information | PASS | one snapshot feeds chips, board and overlay; check S4 | none | — |
| J6 | Accessible controls | PASS | `aria-*` throughout, keyboard-only play, `prefers-reduced-motion` (`styles/accessibility.css`), Esc leaves chat | no touch controls; Space can also press a focused button | add touch input; ignore Space while a button is focused |

### 3.1 Specification ambiguities and the interpretation used

1. **“more than 2 players and fewer than 4 after 20 s”** — read as “at least 2 players”; a 2-player
   lobby therefore starts after 20 s + 10 s. Implemented that way and verified (T1).
2. **Chain reactions** — the spec makes them conditional; this implementation explicitly does not
   chain and documents it. Audited as compliant, not as a missing feature.
3. **Lives after death** — the spec only says “3 lives”; this project adds respawn-at-corner with 2 s
   invincibility. Audited as an extra rule, not a requirement.
4. **“start in the four corners”** with fewer than 4 players — corners 1–3 are used in join order.
5. **No valid winner** — a simultaneous wipe-out yields `winner: null` and “Nobody Survived”.
6. **60 FPS** — no target hardware or measurement method is specified, so the audit requires a
   reproducible measurement rather than a code argument.

---

## 4. Incorrect or broken functionality

### BUG-01 — Map generation produces disconnected 1-cell pockets (MEDIUM)

* **Files:** `backend/game/map.js:16-31` (density `Math.random() < 0.7`), `backend/game/map.js:7-11` (corner clearing)
* **Current behaviour (measured, 2 000 maps):** open floor = 24.6 % of the grid; average connected
  region = 2.8 cells; **median region = 1 cell**; largest region = 26 cells; all four corners mutually
  reachable in **0.0 %** of maps; at least two corners connected in **0.4 %**.
* **Why it is wrong:** the mandatory map requirement implies a playable arena. With 70 % of every
  non-pillar cell filled, nearly all open cells are isolated singletons, so players cannot walk to each
  other without bombing cell by cell. Starting areas are safe (a refuge 2 cells away is guaranteed),
  so this is a gameplay-quality failure rather than a hard spawn trap.
* **Reproduce:** `node /tmp/audit/mapstats2.cjs` (harness kept outside the repo) or run
  `createMap()` 2 000 times and flood-fill the floor.
* **Expected:** a Bomberman-like arena where corridors connect corners and most floor is walkable.
* **Recommended fix:** lower the density to ~0.45–0.55 and carve a guaranteed cross corridor (row and
  column through each corner, or a full open ring inside the border), keeping the pillar grid.
* **Regression test:** ≥ 90 % of generated maps have all four corners connected; no corner region
  smaller than 8 cells.

### BUG-02 — The sixth collected power-up is destroyed with no effect (MEDIUM)

* **Files:** `backend/game/config.js:21` (`MAX_POWERUPS = 5`), `backend/game/moves.js:40-51`
* **Current behaviour:** after 5 total power-ups, `tryMove` clears the tile (`state.tiles[y][x] = EMPTY`)
  but applies nothing because `player.totalPups < MAX_POWERUPS` is false.
* **Why it is wrong:** the player consumes an item and receives no upgrade, with no feedback; nothing
  in the spec authorises a global cap. Verified by check V15 (`tile` becomes `.`, `maxBombs` unchanged,
  `totalPups` stays 5).
* **Expected:** the collected power-up upgrades the player, or remains on the floor.
* **Recommended fix:** remove `MAX_POWERUPS` (individual stat caps already exist) or only remove the
  tile when an effect is applied.
* **Regression test:** collecting N bombs power-ups yields `maxBombs === min(1 + N, MAX_BOMBS)`.

### BUG-03 — A failing socket can abort a whole broadcast (MEDIUM)

* **Files:** `backend/game/helpers.js:6-20`, `backend/transport/websocket.js:83` (`client.on('error', () => {})`)
* **Current behaviour:** `send`/`broadcast` call `client.send(text)` with no `readyState` check and no
  per-client `try/catch`. `ws` reports a send on a non-open socket asynchronously, but a throwing send
  (CONNECTING) or any exception inside the loop aborts the remaining recipients; the error is swallowed.
* **Why it is wrong:** a single unlucky socket can silently deny state updates to other players.
* **Reproduce:** hard to trigger deterministically; instrument `broadcast` with a client whose `send`
  throws and observe that later players in `state.players` miss the update.
* **Expected:** one bad socket must not affect others.
* **Recommended fix:** wrap each `client.send` in `try/catch`, skip when `readyState !== OPEN`, and log
  at most once per client.
* **Regression test:** a broadcast with a throwing client still delivers to the others.

### BUG-04 — The 60 FPS requirement has no evidence (MEDIUM, requirement-level)

* **Files:** `frontend/app.js:24-40`, `README.md:120-127`, missing `PERFORMANCE.md`
* **Current behaviour:** only a live 1-second FPS average is displayed; no benchmark, no recorded
  result, no low-percentile or dropped-frame data, no 4-player stress scenario.
* **Why it is wrong:** the requirement explicitly demands measurement. Source reading cannot prove it.
* **Expected:** a committed, reproducible measurement (average/low-percentile FPS, frame times, hardware,
  method) for a 4-player match with bombs and explosions.
* **Recommended fix:** add `tests/browser-performance.cjs` (the `perf:browser` script already points
  there) that drives 4 headless clients, collects `requestAnimationFrame` deltas for 60 s and writes a
  Markdown report; link it from the README.
* **Regression test:** the benchmark fails if p95 frame time > 20 ms.

### BUG-05 — The declared test suite does not exist (MEDIUM)

* **File:** `backend/package.json:7-10`
* **Current behaviour:** `npm test` runs `node --test ../tests/game.test.cjs …` → exit code **1**,
  “Could not find '../tests/…'”. `perf:server`, `perf:browser`, `audit:browser` point to the same
  missing directory.
* **Why it is wrong:** the project advertises automated verification that cannot run; a CI/evaluator
  will treat this as a broken build.
* **Expected:** `npm test` passes, or no test script exists.
* **Recommended fix:** commit the four referenced suites (game, disconnect, framework, rules) or remove
  the scripts. §10 of this report lists exactly what they should cover.

### BUG-06 — Disconnect destroys the session with no recovery (LOW)

* **File:** `frontend/socket.js:51-58`
* **Current behaviour:** any close event sets `screen: 'login'`, `game: null` and a generic error; the
  name input is kept but the player must reload and re-join. The server has already forfeited the lives.
* **Why it matters:** one Wi-Fi blip ends a match for that player and reduces the match to 3 players.
* **Expected (optional):** a reconnection window (e.g., 10 s) that re-binds the socket to the existing
  player, or at least a clear “you have been eliminated / connection lost” message instead of the login
  screen.
* **Recommended fix:** document it as intended (README does) **and** surface a specific message; add
  reconnection only if the bonus is desired.

### BUG-07 — Connection limit is off by one (LOW)

* **File:** `backend/transport/websocket.js:69`
* **Current behaviour:** `if (wss.clients.size > MAX_CONNECTIONS) client.terminate()` is evaluated after
  the new socket is added, so 51 sockets are accepted before refusal starts.
* **Fix:** `>=`. **Regression test:** the 51st connection is terminated.

### BUG-08 — 792 lines of dead CSS (LOW)

* **File:** `frontend/style.css` (792 lines)
* **Current behaviour:** `index.html:12-17` links only `styles/*.css`; nothing imports or fetches
  `style.css`. It duplicates the theme and old layouts (e.g. `style.css:252` hard-codes an Allal
  avatar).
* **Why it matters:** evaluators may inspect the wrong stylesheet; future edits silently do nothing.
* **Fix:** delete it, or move it to `docs/legacy/` with a note.

### BUG-09 — Documentation points at files that do not exist (LOW)

* **Files:** `README.md:110,124,127`, `backend/API.md:42`, `frontend/assets/README.md:47`
* **Current behaviour:** `ARCHITECTURE.md`, `PERFORMANCE.md`, `frontend/allal/` and
  `frontend/allal/optimized` are referenced but absent; `README.md:65` shows a mojibake `15 ? 13`.
* **Also:** no `death.mp3`/`win.mp3` exist, so `audio.play()` always fails silently (verified: HTTP 404
  for `/assets/characters/allal/death.mp3`, `find … -name '*.mp3'` = 0). The README does say audio is
  optional, but the sound feature as shipped is inert.
* **Fix:** write the two documents or remove the links; fix the `×`; either supply MP3s or state
  explicitly in the README that no sound will play in the submitted version.

### BUG-10 — Small logic/UX defects (LOW)

| File:line | Behaviour | Impact | Fix |
| --- | --- | --- | --- |
| `lobby.js:41` | second `join` from the same socket returns silently | harmless, but no feedback | send `error: 'Already joined'` |
| `lobby.js:68` | `pick` with a non-integer character returns without a message | silent no-op | send a validation error |
| `views/game.js:96-100` | Space both places a bomb and activates a focused button (e.g. sound toggle) | accidental bomb | ignore Space when `document.activeElement` is a button |
| `moves.js:32-50` | players can walk onto each other’s cell | visual overlap, no gameplay effect | optional occupancy check |
| `lives.js:32-40` | bombs of a forfeited player keep their fuse and can kill others | a leaver can decide the winner | drop their bombs, or mark them harmless |
| `app.js:24-40` | hidden tab reports “0 FPS” | misleading indicator | pause the counter when `document.hidden` |

---

## 5. Missing functionality

No mandatory *feature* from sections A–J is absent. What is missing is **evidence and supporting
artefacts**, plus one quality requirement:

| Missing item | Evidence | Depends on | Work required |
| --- | --- | --- | --- |
| Reproducible 60 FPS measurement (I10, I11) | no benchmark files; `PERFORMANCE.md` missing; `perf:browser` points nowhere | Playwright/Puppeteer or raw CDP, 4 scripted clients | scripted 4-player match, rAF sampling, report with avg/p95/dropped frames |
| Automated test suite (BUG-05) | `npm test` exit 1 | — | 4 suites referenced by `package.json`, ~120 assertions (this audit’s harness is a ready blueprint) |
| Architecture and performance docs | README links 404 | — | write `ARCHITECTURE.md`, `PERFORMANCE.md` |
| Character audio | 0 MP3 files; HTTP 404 | recorded assets | add `death.mp3`/`win.mp3` per folder or drop the feature claim |
| Browser/end-to-end verification (H3, I5, J1) | not executable here (no `ws`) | `npm install` in `backend/` | see §13 manual steps |

---

## 6. Unnecessary or excessive code

| Item | Size | Why it is unnecessary | Impact | Worth removing? |
| --- | --- | --- | --- | --- |
| `frontend/style.css` | 792 lines | superseded by `styles/*.css`, not linked anywhere | confusion, false source of truth | **Yes** (or archive) |
| `frontend/framework/router.js` | 7 lines | exported from `framework/index.js:4`, never imported; the game has no routes | dead surface area | Yes (or keep as documented library API — defensible) |
| `backend/game/index.js` re-exports `bombs.placeBomb` | 1 export | production code only calls `queuePlace`; `placeBomb` is used by tests | tiny | No, harmless |
| `frontend/data/SOUNDS.md` | 13 lines | duplicates the audio section of `frontend/assets/README.md` | two documents to keep in sync | Merge |
| `frontend/framework/EXTENSIONS.md` | 75 lines | documents modules, two of which (`audio`, `websocket`) are used; accurate | none | Keep |
| `MAX_POWERUPS` | 1 constant + 4 lines | introduces a rule the spec does not have and silently discards items (BUG-02) | player-visible loss | **Yes** |
| `state.lastSent` dedup map | ~8 lines | needed, but it is the only reason identical JSON is re-serialized every tick | negligible (0.005 ms) | No |

No unused npm dependency exists (`ws` is required). No duplicate game logic between frontend and
backend: the client never re-implements collisions or scoring.

---

## 7. Performance audit

### Animation loop

* `requestAnimationFrame` is called once at startup (`app.js:41`) and re-armed inside `frame`
  (`app.js:38`). There is no second loop, no loop per match, and no path that starts it twice.
* `frame` does three cheap things: `repeatMove(now)` (a comparison and at most one socket send every
  50 ms), an FPS counter, and `store.flush()`.
* The loop never stops; it is page-scoped, which is correct here (no leak across rounds).

### DOM rendering

* Rendering is batched: network messages mutate the pending store, and one render happens per frame
  (`batched-state.js`, verified F17–F18).
* Tiles are cached by visual class and reused as identical virtual nodes (`tiles.js:39-64`), so an
  unchanged board costs 195 string comparisons and zero DOM writes. The server additionally suppresses
  identical snapshots (check S1: 50 idle ticks → 0 messages).
* Player movement uses a CSS `transform` with a server-provided duration (`views/game.js:18-24`), so the
  browser animates on the compositor instead of re-laying out.
* Chat is a keyed list capped at 50 messages (`socket.js:8`).

### Event listeners and timer lifecycle

* One listener per event type per element (`events.js:3-11`), swapped on re-render — verified no
  duplication (F11).
* Global listeners: 4 in `controls.js:45-52`, 2 in `media.js:9-14`, plus `mount`’s single store
  subscription. All are page-lifetime; nothing is created per round, so no accumulation is possible.
* Server: one `setInterval` (`loop.js:40`) and one heartbeat interval (`websocket.js:60`), both
  process-lifetime. `wss.on('close')` clears the heartbeat.
* Cleanups returned by `startControls`/`startSounds` are discarded (`app.js:17-18`) — a latent API
  misuse, not a leak.

### Memory and resource management

* `state.lastSent` is pruned on leave (`lobby.js:79`); disconnected players are removed before the next
  lobby count.
* `lastPositions` (`views/game.js:6`) and the tile caches are bounded (≤ 4 players, 195 cells).
* Chat is capped at 50 entries; the audio buffer cache is keyed by 9 possible URLs.

### Measured results

Environment: Linux container, Node.js v24.21.0, x86_64. Browser engine **not** exercised.

| Measurement | Result | Method |
| --- | --- | --- |
| Server snapshot payload (4 players, 3 bombs, fire, upgrades) | **1 415 bytes** | `JSON.stringify(currentMessage(now))` |
| Server build+serialize per tick | **0.0046 ms** (≈0.23 ms CPU/s at 50 Hz) | 20 000 iterations, `hrtime` |
| Client render+patch per snapshot (game + chat + 4 chips + board) | avg **0.103 ms**, p50 0.076, p95 0.211, p99 0.335, max 0.627 | real `gameView`/`chatView`/`tilesView` + framework `patch`, DOM shim |
| Same, as share of a 16.67 ms frame at 50 snapshots/s | **0.62 %** | derived |
| Worst case, new map array with changed cell classes | **0.082 ms** avg | 100 full-map updates |

**These numbers measure JavaScript only.** They exclude browser style recalculation, layout, paint,
compositing, and CSS animations, so they support — but do not prove — the 60 FPS requirement.

### 60 FPS verdict

**NOT VERIFIED.** No runtime browser measurement could be produced: `backend/node_modules` is absent,
`ws` is not installed and installation permission was declined, and the app cannot start without it.
No committed benchmark exists either, so the mandatory requirement currently has **zero evidence**.

### Recommended profiling and optimisation steps

1. Script a 4-client headless match (Playwright or CDP) and record `requestAnimationFrame` deltas,
   `PerformanceObserver('longtask')`, and frame counts for 60 s.
2. Report average, p5/p50/p95, worst frame, and dropped frames (> 20 ms) — not a single average.
3. Profile a 4-player explosion burst in DevTools; confirm no layout/paint spike from `.fire` gradients
   (the cross gradients on up to ~30 cells are the main risk).
4. Keep the existing dedup: it is the main reason an idle board costs nothing.
5. If paint is the bottleneck, replace the 4-stop radial/linear gradient cross with a single SVG
   texture, as already done for walls/bombs.

---

## 8. Multiplayer and security audit

### Authoritative state

The server is the sole authority: positions, bombs, damage, lives and winners are computed in
`game/*` (`loop.js:16-30`) and broadcast as snapshots. The client cannot send a position, a life count,
a power-up value or a winner. `API.md` states this explicitly and the code matches.

### Confirmed controls

| Control | Implementation | Verified |
| --- | --- | --- |
| Nickname format/length/uniqueness | `lobby.js:29-40`, `NAME_RULE` (`config.js:24`) | yes (T5.1–T5.7) |
| Capacity enforcement | `lobby.js:35` | yes (T4.1–T4.3) |
| Join/pick only while waiting | `lobby.js:34, 66` | yes (T6.1–T6.3) |
| Direction-only movement, cooldown | `moves.js:12-16`, `moves.js:45` | yes (V1–V10) |
| Bomb capacity and dead-player checks | `bombs.js:21-33` | yes (B1–B2) |
| Chat length, rate, joinship | `chat.js:5-16` | yes (C1–C7) |
| JSON/size/rate limits | `transport/websocket.js:7-38` | code + 4 KB / 60 msg/s constants; not executed |
| No HTML injection in chat or names | client renders text nodes only (`framework/dom.js:18`) | static + framework text test |
| Static file allow-list / traversal | `transport/http.js:17-33` | yes: 4 traversal payloads → 404 |

### Confirmed versus theoretical risks

**Confirmed (code-level):**

* **BUG-03** — unguarded `broadcast`, one socket can disrupt a tick.
* **BUG-07** — 51st connection accepted.
* **Rate limiter uses a fixed 1 s window keyed on `Date.now()`**; a client can send 60 messages at the
  end of one window and 60 at the start of the next (burst of 120). Impact is low: game actions are
  further gated by cooldowns/capacity.
* **Nickname confusables** — `Bob`/`bоb` (Cyrillic о) are distinct names that look identical; chat
  attribution could be spoofed visually. No code-level collision check beyond `toLowerCase()`.

**Theoretical (not demonstrated):**

* No per-IP connection limit: 50 sockets from one host are allowed; each is cheap but can occupy the
  lobby.
* No CSP/security headers (`http.js:30`); XSS is currently prevented by construction (text nodes), so
  this is hardening only.
* `client.on('error', () => {})` hides socket errors, which can make diagnosis of the BUG-03 class hard.

### Disconnections

* During `lobby`/`countdown`: the player is removed, the phase falls back to `lobby` when fewer than 2
  remain (`lobby.js:81`), and the remaining clients receive an updated `lobby` message.
* During `playing`: all remaining lives are forfeited (`lives.js:32-40`), the winner is recomputed, and
  the socket receives nothing further (verified L10–L13).
* After `over`: the disconnect does not change the winner or restart the result timer (documented and
  consistent with the code).
* Heartbeat removes half-open connections within ~30 s (not executed).

### Game-state authority / cheating

There is no client-side prediction or authority; the only client-influenced values are the direction,
the intent to place, the chosen character and the chat text. All are validated server-side. Botting by
sending moves at 60 Hz yields no advantage: the server enforces `nextMoveAt`.

---

## 9. Optional bonuses audit

Separate from the mandatory percentage. None of these affect the completion figure above.

| Bonus | Status | Evidence |
| --- | --- | --- |
| Solo mode with AI opponents | **ABSENT** | no AI/bot code in `backend/game/*`; join requires a socket |
| Co-op mode with AI | **ABSENT** | same |
| Bomb Push | **ABSENT** | `moves.js:35-39` treats bombs as solid; no push logic |
| Bomb Pass | **ABSENT** | same check blocks walking onto a bomb cell |
| Block Pass | **ABSENT** | `moves.js:37` blocks every `BLOCK` tile |
| Detonator | **ABSENT** | fuses are fixed (`bombs.js:34`); no remote trigger message |
| Extra-life power-up | **ABSENT** | only `b`, `f`, `s` symbols exist (`config.js:38-41`) |
| Dropping power-ups on death | **ABSENT** | `lives.js:7-21` resets position only |
| Team mode | **ABSENT** | `checkWinner` counts individuals (`lives.js:25`) |
| Ghost / revival | **ABSENT** | eliminated players become spectators permanently (`moves.js:12`) |

The absence of bonuses is **not** counted as a failure.

---

## 10. Testing report

Harnesses were written **outside the repository** (`/tmp/audit/`) so no project file was touched. They
load the real backend modules with a stubbed `Date.now` and a fake `setInterval` (for deterministic
ticks), and the real framework modules with a minimal DOM shim. Two framework files were copied
byte-identically to `/tmp/audit/fw/` (`diff` of SHA-256 sums confirms identity) only so Node would treat
them as ES modules.

| ID | Test | Purpose | Status | Result | Evidence / limitation |
| --- | --- | --- | --- | --- | --- |
| T-01 | `node /tmp/audit/harness.cjs` | Lobby timing, capacity, nicknames, map invariants, bombs, movement, power-ups, lives, winner, chat, message dedup, constants | **RUN** | **118 / 118 PASS** (exit 0) | Drives real `lobby/moves/bombs/lives/chat/messages/loop` modules |
| T-02 | `node /tmp/audit/framework-test.mjs` | `h`, `createElement`, keyed diff, text/attr/style/property updates, listener reuse, removal, `mount`, batched store | **RUN** | **23 / 23 PASS** (exit 0) | DOM shim, not a browser |
| T-03 | `node /tmp/audit/http-test.cjs` | Static server correctness, traversal, content types, missing assets | **RUN** | 16/16 expected (`/../backend/server.js` → 404; `.mp3` → 404) | real `serveFile` |
| T-04 | `node /tmp/audit/mapstats2.cjs` | Map connectivity statistics | **RUN** | 2 000 maps: 24.6 % floor, median region 1 cell, corners connected 0.0 % | feeds D8 / BUG-01 |
| T-05 | `node /tmp/audit/perf-server.cjs` | Server snapshot cost | **RUN** | 1 415 B, 0.0046 ms/tick | Node 24.21, no sockets |
| T-06 | `node /tmp/audit/perf-client.mjs` | Client render+patch cost | **RUN** | avg 0.103 ms, p95 0.211 ms | JS only, DOM shim |
| T-07 | `cd backend && npm test` | Declared test suite | **RUN** | **FAIL** (exit 1): `Could not find '../tests/…'` | BUG-05 |
| T-08 | `grep -ri "canvas\|webgl\|getContext"` | Rendering restrictions | **RUN** | no matches | static |
| T-09 | `git status --porcelain` | No project modifications | **RUN** | empty | — |
| T-10 | Browser session, login → lobby → match → result | Visual + real-time behaviour | **NOT RUN** | — | requires `ws` (declined) and a browser |
| T-11 | Two-tab chat over a real WebSocket | H3 | **NOT RUN** | — | same |
| T-12 | 2-, 3- and 4-player live matches | End-to-end matchmaking | **NOT RUN** | — | same |
| T-13 | Network disconnect / reconnect | H7, H12 | **NOT RUN** | — | same |
| T-14 | Death/win audio playback | Sound assets | **NOT RUN** | — | no MP3 files exist (404 verified) |
| T-15 | 60 FPS measurement in a browser | I10, I11 | **NOT RUN** | — | no runnable server |

**Tests that could not be automated — manual steps**

1. `cd backend && npm install && npm start`, open four private windows at `http://localhost:8080`.
2. Join with 4 distinct nicknames; confirm the counter shows 4/4 and a 10 s countdown starts at once.
3. Repeat with 2 players: verify a 20 s wait, then a 10 s countdown, then a 2-player match.
4. Play a full round: verify 3 hearts, one life per explosion, respawn at your corner with blinking,
   elimination, the winner overlay, and the return to the lobby after 5 s.
5. Collect at least 6 power-ups of any kind and confirm the cap behaviour (BUG-02).
6. Send chat from every window, including a dead player; check attribution and 300 ms throttling.
7. Close one tab mid-match: the survivor should see “Forfeit” and the round should end if only one
   player remains.
8. Record 60 s of a 4-player match in DevTools Performance → report average FPS, p95 frame time,
   long tasks, and the number of dropped frames.

---

## 11. Prioritized remediation plan

### P0 — Blockers

**None confirmed.** The server starts and the game logic is correct once `ws` is installed. (The
unverified runtime is the only reason this cannot be asserted with full confidence — see §13.)

### P1 — Mandatory requirements

| Task | Outcome | Files | Depends on | Definition of done |
| --- | --- | --- | --- | --- |
| P1-1 Fix map density/connectivity (BUG-01) | Playable arena with connected corners | `backend/game/map.js` | — | ≥ 90 % of 2 000 generated maps have all four corners connected; no corner region < 8 cells; spawn refuge at distance 2 still guaranteed |
| P1-2 Remove the power-up cap (BUG-02) | Every collected item has an effect | `config.js`, `moves.js` | — | 6th pickup raises the relevant stat or stays on the floor; regression test added |
| P1-3 Provide 60 FPS evidence (BUG-04) | Measured, reproducible benchmark | new `tests/browser-performance.cjs`, `PERFORMANCE.md`, README | local `ws` install | 4-player scripted match, 60 s sample, avg/p95/dropped frames reported with hardware and method |
| P1-4 Repair or remove `npm test` (BUG-05) | Working verification entry point | `backend/package.json`, new `tests/*.test.cjs` | — | `npm test` exits 0 and covers lobby, rules, disconnect, framework |
| P1-5 Execute the manual matrix (§10) | End-to-end confirmation of H3, F5, J1, I5 | — | local `npm install` | §12 checklist fully ticked |

### P2 — Reliability and performance

| Task | Outcome | Files | Depends on | Definition of done |
| --- | --- | --- | --- | --- |
| P2-1 Harden broadcast (BUG-03) | One bad socket cannot starve others | `helpers.js`, `transport/websocket.js` | — | send guarded by `readyState` + `try/catch`; test with a throwing client |
| P2-2 Fix connection cap (BUG-07) | Exact 50-client limit | `transport/websocket.js` | — | 51st connection terminated |
| P2-3 Improve FPS metric (I9) | Actionable indicator | `app.js`, `views/game.js` | — | rolling window with min/p95; paused while hidden |
| P2-4 Disconnect UX / optional reconnect (BUG-06) | Player is not silently kicked to login | `socket.js`, `transport/websocket.js`, `lobby.js` | design decision | clear message plus (optional) 10 s re-bind window |
| P2-5 Forfeit bomb fairness | Leavers cannot decide the round | `lives.js` / `bombs.js` | — | forfeited player’s bombs are removed or defused |
| P2-6 Player overlap | Players cannot share a cell | `moves.js` | — | move onto an occupied cell rejected; test added |

### P3 — Quality improvements

| Task | Outcome | Files | Depends on | Definition of done |
| --- | --- | --- | --- | --- |
| P3-1 Delete dead CSS (BUG-08) | One stylesheet source | `frontend/style.css` | — | file removed; `index.html` unchanged and page still renders |
| P3-2 Fix documentation links (BUG-09) | No 404 docs | `README.md`, `API.md`, `assets/README.md` | P1-3 | `ARCHITECTURE.md` and `PERFORMANCE.md` exist or links removed; `15 × 13` fixed |
| P3-3 Audio assets or explicit statement | Honest feature status | `frontend/assets/characters/*` | recordings | MP3s load (HTTP 200) or README says no audio ships |
| P3-4 Remove unused router export or document it | Clean framework surface | `framework/index.js`, `EXTENSIONS.md` | — | no unused export, or documented as library API |
| P3-5 Touch controls | Playable on tablets/phones | `game/controls.js`, `views/game.js` | — | on-screen D-pad + bomb button; keyboard unchanged |
| P3-6 Space-vs-button conflict | No accidental bomb | `controls.js` | — | Space ignored when a button has focus |
| P3-7 Merge `data/SOUNDS.md` into `assets/README.md` | One audio doc | docs | — | single source |

---

## 12. Final evaluation checklist

- [ ] `cd backend && npm test` exits 0.
- [ ] `cd backend && npm start` then four private windows join with distinct nicknames.
- [ ] Lobby shows a counter that never exceeds 4/4, and 5th join is refused with “Game is full”.
- [ ] Duplicate nickname (different case) is refused.
- [ ] 2 players → 20 s wait → 10 s countdown → match starts; 4 players → 10 s countdown immediately.
- [ ] Each player starts in a different corner with 3 hearts.
- [ ] Walls block movement; blocks block movement and are destroyed by flames.
- [ ] A bomb explodes after ~3 s; flames extend 1 cell per flame power and stop at walls, blocks and bombs.
- [ ] Standing in flames costs exactly one life; respawn at your corner with blinking invulnerability.
- [ ] Each of the three power-ups changes the HUD (`💣`, `🔥`, `⚡`) and the behaviour.
- [ ] Losing all 3 lives shows “Out” and blocks movement while allowing chat.
- [ ] Last survivor shows “You Win!” / “<name> Wins!”; a simultaneous wipe-out shows “Nobody Survived”.
- [ ] After 5 s everyone returns to the waiting room and can play again.
- [ ] Chat works in lobby and match, with correct names, 200-char limit and no HTML injection
      (type `<img src=x onerror=alert(1)>`).
- [ ] Closing a tab mid-match forfeits that player; the round resolves.
- [ ] No Canvas/WebGL/third-party UI framework in the network tab; only own modules + Google Fonts.
- [ ] `BOMBERMAN_AUDIT_REPORT.md` P1 items are closed, and a measured 60 FPS report is committed.

---

## 13. Limitations

| Not inspected / run | Why | How to verify manually |
| --- | --- | --- |
| Live server, WebSocket chat, lobby over the network | `backend/node_modules` absent; installing `ws` was explicitly declined (audit rule 7) | `cd backend && npm install && npm start`; open 2–4 windows; run §10 steps 1–7 |
| Real end-to-end browser flow (J1) | Same, plus the client needs a socket to leave the login screen | Manual §10 step 2–5 |
| Explosion visuals (F5) | No browser run | Check `.fire.h`, `.fire.v`, `.fire.c` render as a joined cross (`styles/game.css:81-110`) |
| Layout/paint performance (I5) | Needs a real browser profile | DevTools Performance, 4-player explosion burst |
| 60 FPS (I10, I11) | No runnable server; no committed benchmark | §10 step 8; record avg, p95, dropped frames, hardware |
| Heartbeat / stale connections (H12) | Needs real TCP peers | Join, then freeze the client tab/process; server should terminate within ~30 s |
| Rate limits (H11) | Socket layer not executed | Scripted client sending >60 and >200 msg/s; observe ignored messages and close 1008 |
| Audio playback (F5/J1) | No MP3 files exist (HTTP 404 verified) | Add MP3s, then lose a life / win a round |
| Client render cost in a browser | Measured with a DOM shim (JS only) | Chrome Performance → compare JS time with this report’s 0.103 ms |

**Environment:** Linux, Node.js v24.21.0, npm 11.19.0, Google Chrome installed but not launched
against the app. Harnesses and measurement scripts live in `/tmp/audit/` and are not part of the
repository.

**What this audit does and does not claim:** the game *logic* is verified by execution (118 + 23
checks); the *browser experience*, the *WebSocket transport in operation* and the *60 FPS requirement*
are not, and are reported as **NOT VERIFIED**, never as passed.
