import { store, flushStore } from '../state/store.js'
import { repeatMove } from './controls.js'

export function startLoop() {
  let frames = 0
  let fpsStartedAt = performance.now()
  let frameId

  function frame(now) {
    repeatMove(now)
    frames++

    if (now - fpsStartedAt >= 1000) {
      store.setState({ fps: Math.round(frames * 1000 / (now - fpsStartedAt)) })
      frames = 0
      fpsStartedAt = now
    }

    flushStore()
    frameId = requestAnimationFrame(frame)
  }

  frameId = requestAnimationFrame(frame)
  return () => cancelAnimationFrame(frameId)
}
