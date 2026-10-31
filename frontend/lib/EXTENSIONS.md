# Reusable extensions

These browser utilities live next to the mini-framework, not inside it. The
`frontend/framework/` folder stays unchanged (`index.js`, `dom.js`, `events.js`,
`state.js`, `router.js`). Import an extension directly from its file; no build
step or extra package is required.

## JSON WebSocket client

```js
import { createJsonSocket } from './websocket.js'

const socket = createJsonSocket() // ws/wss on the current page's host
socket.connect({
  onMessage: message => console.log(message),
  onClose: () => console.log('Disconnected'),
})
socket.send({ type: 'example' })
socket.close()
```

Pass a URL to `createJsonSocket(url)` for another endpoint. Creating the client
does not open a connection; `connect()` does. It returns `false` if a connection
is already opening, open or closing. There is no automatic reconnection or
offline message queue. Each client instance owns one connection.

Optional callbacks are `onOpen`, `onMessage`, `onClose`, `onError` and
`onInvalidMessage`. JSON decoding belongs here; application-specific message
validation and effects belong in the caller. Callback errors are not swallowed
as JSON errors. Invalid JSON is ignored and reported through `onInvalidMessage`.
`send()` returns `false` when disconnected or serialization/sending fails, and
reports sending failures through `onError`. The default error callbacks log to
the console. Old connection callbacks are ignored after an explicit reconnect.

## Batched store

```js
import { createBatchedStore } from './batched-state.js'

const store = createBatchedStore({ count: 0 })
store.setState({ count: 1 })
store.setState(state => ({ count: state.count + 1 }))
console.log(store.getState().count) // 2 immediately
store.flush() // one notification to subscribers
```

This wraps the original `createStore` without changing its implementation.
`getState`, `setState`, `subscribe` and `unsubscribe` keep the same interface.
`flush()` commits all pending changes together. A flush with no changes does
nothing; changes staged by a subscriber remain pending for the next flush.
Instances are independent.

The caller owns scheduling. Bomberman calls `flush()` once in its existing
animation loop, so this module adds no extra timer or animation-frame callback.

## Image preloading

```js
import { preloadImages } from './images.js'

const images = await preloadImages(['/images/first.webp', '/images/second.webp'])
```

The promise resolves with image elements only after every image has decoded.
Retain the returned array while the assets are needed. A failed download/decode
rejects the promise so the caller can show an error and offer retry. URLs,
loading screens and application state are deliberately owned by the caller.

## Recorded audio playback

Import `createAudioPlayer` from `./audio.js`, unlock it from a user gesture, then
call `await audio.play('/assets/characters/allal/death.mp3')`. Use
`audio.setEnabled(false)` to mute.

The player downloads and decodes actual audio files. Decoded buffers are cached
by URL, including concurrent requests. Each playback gets its own buffer source,
which disconnects when finished. There are no oscillators or synthesized tones.
Web Audio is only used for decoding recordings and playing them reliably after
a user gesture. Muting silences active recordings and prevents new playback.

Use `audio.play(url, { channel: 'intro' })` for recordings that should replace
each other. Starting another clip on that channel stops its current source and
invalidates pending playback, including when the new file is missing.
`audio.stop('intro')` stops that channel explicitly. Calls without a channel
continue to overlap independently, such as simultaneous player deaths.

Missing/invalid files return false without blocking game state updates. Failed
downloads are retryable on the next death. The application owns the MP3 URLs
and life-loss detection. The server serves MP3 files with audio/mpeg.
