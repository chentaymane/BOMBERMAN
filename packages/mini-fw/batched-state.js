import { createStore } from './state.js'

/** Stage changes immediately; notify subscribers only when the caller flushes. */
export function createBatchedStore(initialState) {
  const committed = createStore(initialState)
  let pending = committed.getState()
  let dirty = false

  function setState(update) {
    const changes = typeof update === 'function' ? update(pending) : update
    pending = { ...pending, ...changes }
    dirty = true
  }

  function flush() {
    if (!dirty) return
    dirty = false
    committed.setState(pending)
  }

  return {
    getState: () => pending,
    setState,
    flush,
    subscribe: committed.subscribe,
    unsubscribe: committed.unsubscribe,
  }
}
